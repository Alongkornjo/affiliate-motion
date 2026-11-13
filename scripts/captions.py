#!/usr/bin/env python3
"""Generate word-level Thai karaoke captions using Google Cloud Speech-to-Text
anchor-word alignment mapped onto the clean original Thai script segmented with Node Intl.Segmenter('th').
Preserves natural Thai phrase boundaries and avoids breaking compound/transliterated words."""

import argparse
import base64
import difflib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
STT_ENDPOINT = "https://speech.googleapis.com/v1/speech:recognize"
DEFAULT_KEY_PATH = os.path.expanduser("~/.gemini/secrets/gcp-tts.json")


def segment_thai_with_phrases(text: str) -> list[dict]:
    """Segment Thai script into words using Node Intl.Segmenter('th'), preserving
    space/punctuation phrase boundaries and repairing broken orphan syllables (e.g. 'ท์')."""
    js_code = """
    const text = process.argv[1];
    const seg = new Intl.Segmenter('th', { granularity: 'word' });
    const chunks = text.trim().split(/\\s+/);
    const tokens = [];
    for (let gIdx = 0; gIdx < chunks.length; gIdx++) {
      const chunk = chunks[gIdx];
      let firstInChunk = true;
      for (const part of seg.segment(chunk)) {
        const raw = part.segment.trim();
        if (!raw) continue;
        if (/^[.,!?…"“”'()\\-]+$/.test(raw)) {
          if (tokens.length > 0) tokens[tokens.length - 1].punctAfter = true;
          continue;
        }
        tokens.push({
          word: raw,
          groupId: gIdx,
          phraseStart: firstInChunk,
          punctAfter: false,
        });
        firstInChunk = false;
      }
      if (tokens.length > 0 && /[.,!?…]$/.test(chunk)) {
        tokens[tokens.length - 1].punctAfter = true;
      }
    }
    console.log(JSON.stringify(tokens));
    """
    out = subprocess.check_output(["node", "-e", js_code, text], text=True)
    raw_tokens = json.loads(out)

    # Merge orphan karan/final-consonant fragments (e.g. 'คิว' + 'ท์' -> 'คิวท์', 'โอ' + 'เคี' + 'ยะ')
    merged: list[dict] = []
    for tok in raw_tokens:
        w = tok["word"]
        # Check if token has karan (\u0e4c) and <= 3 chars or is a tiny vowel-less fragment within same group
        is_orphan_suffix = (
            len(merged) > 0
            and merged[-1]["groupId"] == tok["groupId"]
            and (
                "\u0e4c" in w
                or (len(w) <= 2 and re.fullmatch(r"[\u0e01-\u0e2e\u0e30-\u0e3a\u0e47-\u0e4e]+", w) and len(merged[-1]["word"]) <= 3)
                or w in ("ท์", "ต์", "ด์", "ซ์", "ร์", "ฟ์", "ส์", "ล์", "น์", "ม์")
            )
        )
        if is_orphan_suffix:
            merged[-1]["word"] += w
            merged[-1]["punctAfter"] = merged[-1]["punctAfter"] or tok["punctAfter"]
        else:
            merged.append(tok)

    return merged


def get_audio_duration(audio_path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(audio_path)],
        text=True,
    ).strip()
    return float(out)


def extract_stt_timings(audio_path: Path, key_path: str) -> list[dict]:
    """Convert audio to 16kHz mono LINEAR16 WAV and call Google STT for word time offsets."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = Path(tmp.name)

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(audio_path), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav_path)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        audio_b64 = base64.b64encode(wav_path.read_bytes()).decode("ascii")
    finally:
        wav_path.unlink(missing_ok=True)

    creds = service_account.Credentials.from_service_account_file(key_path, scopes=SCOPES)
    creds.refresh(Request())

    payload = {
        "config": {
            "encoding": "LINEAR16",
            "sampleRateHertz": 16000,
            "languageCode": "th-TH",
            "enableWordTimeOffsets": True,
        },
        "audio": {"content": audio_b64},
    }
    resp = requests.post(
        STT_ENDPOINT,
        headers={"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"STT error {resp.status_code}: {resp.text[:300]}")

    words = []
    for result in resp.json().get("results", []):
        alts = result.get("alternatives", [])
        if alts:
            for w in alts[0].get("words", []):
                start = float(w.get("startTime", "0s").rstrip("s"))
                end = float(w.get("endTime", "0s").rstrip("s"))
                words.append({"word": w.get("word", ""), "start": start, "end": end})
    return words


def _word_weight(w: str) -> float:
    return max(len(re.sub(r"[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]", "", w)), 1.5)


def align_words_to_timings(clean_tokens: list[dict], stt_words: list[dict], total_duration: float) -> list[dict]:
    """Anchor-word alignment preserving phrase metadata."""
    if not clean_tokens:
        return []

    clean_words = [t["word"] for t in clean_tokens]

    if not stt_words:
        span = max(total_duration - 0.2, 0.5)
        weights = [_word_weight(w) for w in clean_words]
        total_w = sum(weights)
        cursor = 0.1
        out = []
        for tok, wt in zip(clean_tokens, weights):
            dur = span * (wt / total_w)
            out.append({**tok, "start": round(cursor, 3), "end": round(cursor + dur, 3)})
            cursor += dur
        return out

    clean_norm = [w.lower() for w in clean_words]
    stt_norm = [w["word"].lower() for w in stt_words]
    matcher = difflib.SequenceMatcher(None, clean_norm, stt_norm, autojunk=False)

    anchors: dict[int, tuple[float, float]] = {}
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset in range(i2 - i1):
                sw = stt_words[j1 + offset]
                anchors[i1 + offset] = (sw["start"], sw["end"])

    aligned: list[dict | None] = [None] * len(clean_tokens)
    for idx, (s, e) in anchors.items():
        aligned[idx] = {**clean_tokens[idx], "start": round(s, 3), "end": round(max(e, s + 0.08), 3)}

    speech_start = stt_words[0]["start"]
    speech_end = min(stt_words[-1]["end"], total_duration)

    i = 0
    while i < len(clean_tokens):
        if aligned[i] is not None:
            i += 1
            continue
        gap_start = i
        while i < len(clean_tokens) and aligned[i] is None:
            i += 1
        gap_end = i

        t_start = aligned[gap_start - 1]["end"] if gap_start > 0 else speech_start  # type: ignore[index]
        t_end = aligned[gap_end]["start"] if gap_end < len(clean_tokens) else speech_end  # type: ignore[index]
        if t_end <= t_start:
            t_end = t_start + 0.15 * (gap_end - gap_start)

        weights = [_word_weight(clean_words[k]) for k in range(gap_start, gap_end)]
        total_w = sum(weights) or 1.0
        cursor = t_start
        for k, wt in zip(range(gap_start, gap_end), weights):
            dur = (t_end - t_start) * (wt / total_w)
            aligned[k] = {
                **clean_tokens[k],
                "start": round(cursor, 3),
                "end": round(cursor + dur, 3),
            }
            cursor += dur

    return aligned  # type: ignore[return-value]


def _visual_len(w: str) -> int:
    # Count base characters excluding Thai combining vowels/tones above/below
    return len(re.sub(r"[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]", "", w))


def group_into_lines(aligned_tokens: list[dict], max_chars: int = 22) -> list[dict]:
    """Group Thai words into complete-meaning mobile lines:
    1. Break cleanly at punctuation (!, ?, …) or audible pauses (> 0.22s).
    2. Break at natural space-separated phrase chunks before overflowing.
    3. Keep short orphan fragments attached and strip internal metadata."""
    if not aligned_tokens:
        return []

    # First group by original space-delimited chunks (unless a chunk itself is > max_chars)
    lines_raw: list[list[dict]] = []
    current: list[dict] = []
    current_vlen = 0

    for idx, item in enumerate(aligned_tokens):
        w = item["word"]
        vlen = _visual_len(w)
        prev = current[-1] if current else None

        should_break = False
        if prev:
            pause_gap = item["start"] - prev["end"]
            # Hard sentence punctuation break
            if prev.get("punctAfter") and current_vlen >= 6:
                should_break = True
            # Audible breath pause
            elif pause_gap >= 0.22 and current_vlen >= 7:
                should_break = True
            # Natural space-phrase boundary when line already reasonably filled
            elif item.get("phraseStart") and current_vlen >= 13:
                should_break = True
            # Prevent overflow
            elif current_vlen + vlen > max_chars:
                # If we're mid-space-chunk and the chunk fits on its own line, move the whole chunk to next line!
                if not item.get("phraseStart") and current_vlen >= 10:
                    # Find start of current chunk inside `current`
                    split_at = len(current)
                    for back in range(len(current) - 1, 0, -1):
                        if current[back].get("phraseStart"):
                            split_at = back
                            break
                    if 0 < split_at < len(current):
                        moved = current[split_at:]
                        current = current[:split_at]
                        lines_raw.append(current)
                        current = moved
                        current_vlen = sum(_visual_len(x["word"]) for x in current)
                    else:
                        should_break = True
                else:
                    should_break = True

        if should_break and current:
            lines_raw.append(current)
            current = []
            current_vlen = 0

        current.append(item)
        current_vlen += vlen

    if current:
        if lines_raw and sum(_visual_len(x["word"]) for x in current) <= 5:
            lines_raw[-1].extend(current)
        else:
            lines_raw.append(current)

    # Rebalance any tiny line (<= 7 visible chars) by stealing the last phrase/word from previous line if needed
    for i in range(1, len(lines_raw)):
        cur_vlen = sum(_visual_len(x["word"]) for x in lines_raw[i])
        prev_line = lines_raw[i - 1]
        if cur_vlen <= 7 and len(prev_line) >= 3 and not prev_line[-1].get("punctAfter"):
            # Move 1-2 words from end of prev_line to start of current line
            moved = prev_line.pop()
            lines_raw[i].insert(0, moved)

    lines = []
    for chunk in lines_raw:
        clean_words = [{"word": x["word"], "start": x["start"], "end": x["end"]} for x in chunk]
        lines.append({
            "start": clean_words[0]["start"],
            "end": clean_words[-1]["end"],
            "text": "".join(x["word"] for x in clean_words),
            "words": clean_words,
        })
    return lines


def main():
    parser = argparse.ArgumentParser(description="Generate Thai karaoke captions JSON")
    parser.add_argument("--script", required=True, help="Clean Thai narration text")
    parser.add_argument("--audio", required=True, help="Path to voiceover audio file")
    parser.add_argument("--key", default=DEFAULT_KEY_PATH, help="GCP service account JSON")
    parser.add_argument("--max-chars", type=int, default=25, help="Max visible characters per caption line")
    parser.add_argument("--out", required=True, help="Output JSON path")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    total_duration = get_audio_duration(audio_path)
    clean_tokens = segment_thai_with_phrases(args.script)

    try:
        stt_words = extract_stt_timings(audio_path, args.key)
    except Exception as exc:
        print(f"[warn] STT failed ({exc}), falling back to duration-envelope timing")
        stt_words = []

    aligned = align_words_to_timings(clean_tokens, stt_words, total_duration)
    lines = group_into_lines(aligned, max_chars=args.max_chars)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "duration_sec": round(total_duration, 3),
        "word_count": len(aligned),
        "line_count": len(lines),
        "lines": lines,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"out": str(out_path), "duration_sec": payload["duration_sec"], "lines": len(lines)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
