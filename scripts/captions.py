#!/usr/bin/env python3
"""Generate word-level Thai karaoke captions using Google Cloud Speech-to-Text
anchor-word alignment mapped onto the clean original Thai script segmented with Node Intl.Segmenter('th')."""

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


def segment_thai_words(text: str) -> list[str]:
    """Use Node.js Intl.Segmenter('th', {granularity: 'word'}) so Thai lines never break mid-word."""
    js_code = """
    const text = process.argv[1];
    const seg = new Intl.Segmenter('th', { granularity: 'word' });
    const tokens = [];
    for (const part of seg.segment(text)) {
      const s = part.segment.trim();
      if (s.length > 0 && !/^[.,!?…"“”'()\\-]+$/.test(s)) {
        tokens.push(s);
      }
    }
    console.log(JSON.stringify(tokens));
    """
    out = subprocess.check_output(["node", "-e", js_code, text], text=True)
    return json.loads(out)


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


def align_words_to_timings(clean_words: list[str], stt_words: list[dict], total_duration: float) -> list[dict]:
    """Anchor-word alignment: match clean Intl.Segmenter words against STT words via SequenceMatcher
    so mid-sentence pauses are preserved while keeping 100% clean Thai spelling."""
    if not clean_words:
        return []

    if not stt_words:
        # Fallback if STT returned nothing
        span = max(total_duration - 0.2, 0.5)
        weights = [_word_weight(w) for w in clean_words]
        total_w = sum(weights)
        cursor = 0.1
        out = []
        for w, wt in zip(clean_words, weights):
            dur = span * (wt / total_w)
            out.append({"word": w, "start": round(cursor, 3), "end": round(cursor + dur, 3)})
            cursor += dur
        return out

    clean_norm = [w.lower() for w in clean_words]
    stt_norm = [w["word"].lower() for w in stt_words]
    matcher = difflib.SequenceMatcher(None, clean_norm, stt_norm, autojunk=False)

    # Map matched clean indices to STT start/end
    anchors: dict[int, tuple[float, float]] = {}
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset in range(i2 - i1):
                sw = stt_words[j1 + offset]
                anchors[i1 + offset] = (sw["start"], sw["end"])

    # Fill gaps between anchors proportionally
    aligned = [None] * len(clean_words)
    for idx, (s, e) in anchors.items():
        aligned[idx] = {"word": clean_words[idx], "start": round(s, 3), "end": round(max(e, s + 0.08), 3)}

    speech_start = stt_words[0]["start"]
    speech_end = min(stt_words[-1]["end"], total_duration)

    i = 0
    while i < len(clean_words):
        if aligned[i] is not None:
            i += 1
            continue
        gap_start = i
        while i < len(clean_words) and aligned[i] is None:
            i += 1
        gap_end = i  # exclusive

        t_start = aligned[gap_start - 1]["end"] if gap_start > 0 else speech_start
        t_end = aligned[gap_end]["start"] if gap_end < len(clean_words) else speech_end
        if t_end <= t_start:
            t_end = t_start + 0.15 * (gap_end - gap_start)

        weights = [_word_weight(clean_words[k]) for k in range(gap_start, gap_end)]
        total_w = sum(weights) or 1.0
        cursor = t_start
        for k, wt in zip(range(gap_start, gap_end), weights):
            dur = (t_end - t_start) * (wt / total_w)
            aligned[k] = {
                "word": clean_words[k],
                "start": round(cursor, 3),
                "end": round(cursor + dur, 3),
            }
            cursor += dur

    return aligned  # type: ignore[return-value]


def group_into_lines(aligned_words: list[dict], max_chars: int = 22) -> list[dict]:
    """Group Thai words into readable mobile lines without breaking mid-word."""
    lines = []
    current = []
    current_len = 0

    for item in aligned_words:
        w = item["word"]
        w_len = len(w)
        if current and (current_len + w_len > max_chars or len(current) >= 6):
            lines.append({
                "start": current[0]["start"],
                "end": current[-1]["end"],
                "text": "".join(x["word"] for x in current),
                "words": current,
            })
            current = []
            current_len = 0
        current.append(item)
        current_len += w_len

    if current:
        lines.append({
            "start": current[0]["start"],
            "end": current[-1]["end"],
            "text": "".join(x["word"] for x in current),
            "words": current,
        })
    return lines


def main():
    parser = argparse.ArgumentParser(description="Generate Thai karaoke captions JSON")
    parser.add_argument("--script", required=True, help="Clean Thai narration text")
    parser.add_argument("--audio", required=True, help="Path to voiceover audio file")
    parser.add_argument("--key", default=DEFAULT_KEY_PATH, help="GCP service account JSON")
    parser.add_argument("--max-chars", type=int, default=22, help="Max characters per caption line")
    parser.add_argument("--out", required=True, help="Output JSON path")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    total_duration = get_audio_duration(audio_path)
    clean_words = segment_thai_words(args.script)

    try:
        stt_words = extract_stt_timings(audio_path, args.key)
    except Exception as exc:
        print(f"[warn] STT failed ({exc}), falling back to duration-envelope timing")
        stt_words = []

    aligned = align_words_to_timings(clean_words, stt_words, total_duration)
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
