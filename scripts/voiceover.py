#!/usr/bin/env python3
"""Generate natural Thai voiceover via Gemini 2.5 Flash TTS (with Chirp 3 HD fallback)
and post-process with FFmpeg (silence trim + tempo pacing + -14 LUFS loudness normalization)."""

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"
DEFAULT_KEY_PATH = os.path.expanduser("~/.gemini/secrets/gcp-tts.json")
VOICE_MAP_PATH = Path(__file__).parent / "voice_map.json"


def select_voice(category: str, explicit_voice: str | None = None) -> tuple[str, dict]:
    with open(VOICE_MAP_PATH, "r", encoding="utf-8") as f:
        vmap = json.load(f)
    voices = vmap["voices"]
    if explicit_voice and explicit_voice in voices:
        return explicit_voice, voices[explicit_voice]
    cat_lower = (category or "").lower()
    for name, info in voices.items():
        if any(k.lower() in cat_lower for k in info.get("categories", [])):
            return name, info
    default_name = vmap.get("default_voice", "Achird")
    return default_name, voices[default_name]


def get_access_token(key_path: str) -> str:
    creds = service_account.Credentials.from_service_account_file(key_path, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token


def synthesize_gemini_tts(token: str, text: str, voice_name: str, style_prompt: str) -> bytes:
    payload = {
        "input": {
            "text": text,
            "prompt": f"พูดภาษาไทยด้วยน้ำเสียง{style_prompt} กระชับ ชัดเจน เหมาะกับคลิปรีวิวสินค้า TikTok และ Reels"
        },
        "voice": {
            "languageCode": "th-TH",
            "name": voice_name,
            "modelName": "gemini-2.5-flash-tts"
        },
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "sampleRateHertz": 24000
        }
    }
    resp = requests.post(
        TTS_ENDPOINT,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Gemini TTS error {resp.status_code}: {resp.text[:300]}")
    audio_b64 = resp.json().get("audioContent")
    if not audio_b64:
        raise RuntimeError("Empty audioContent from Gemini TTS")
    return base64.b64decode(audio_b64)


def synthesize_chirp_fallback(token: str, text: str, chirp_voice: str) -> bytes:
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": "th-TH",
            "name": chirp_voice
        },
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "sampleRateHertz": 24000
        }
    }
    resp = requests.post(
        TTS_ENDPOINT,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Chirp fallback error {resp.status_code}: {resp.text[:300]}")
    return base64.b64decode(resp.json()["audioContent"])


def post_process_audio(raw_wav: Path, out_path: Path, tempo: float = 1.06) -> float:
    """Trim leading/trailing silence, apply slight tempo boost, normalize to -14 LUFS."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # 1. Trim leading silence & trailing silence, apply atempo, loudnorm
    af_filters = [
        "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB",
        "areverse",
        "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB",
        "areverse",
    ]
    if tempo and abs(tempo - 1.0) > 0.01:
        af_filters.append(f"atempo={tempo:.3f}")
    af_filters.append("loudnorm=I=-14:TP=-1.5:LRA=11")
    af_chain = ",".join(af_filters)

    codec_args = ["-c:a", "libmp3lame", "-b:a", "192k"] if out_path.suffix.lower() == ".mp3" else ["-c:a", "pcm_s16le", "-ar", "44100"]
    cmd = [
        "ffmpeg", "-y", "-i", str(raw_wav),
        "-af", af_chain,
        *codec_args,
        str(out_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    probe = subprocess.check_output(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(out_path)],
        text=True,
    ).strip()
    return float(probe)


def main():
    parser = argparse.ArgumentParser(description="Generate Thai voiceover with Gemini 2.5 Flash TTS")
    parser.add_argument("--text", required=True, help="Thai narration text")
    parser.add_argument("--category", default="ทั่วไป", help="Product category for voice selection")
    parser.add_argument("--voice", default=None, help="Explicit Gemini voice name (optional)")
    parser.add_argument("--tempo", type=float, default=1.06, help="Playback tempo multiplier (default 1.06)")
    parser.add_argument("--key", default=DEFAULT_KEY_PATH, help="Path to GCP service account JSON")
    parser.add_argument("--out", required=True, help="Output audio path (.mp3 or .wav)")
    args = parser.parse_args()

    voice_name, voice_info = select_voice(args.category, args.voice)
    token = get_access_token(args.key)

    engine_used = "gemini-2.5-flash-tts"
    try:
        audio_bytes = synthesize_gemini_tts(token, args.text, voice_name, voice_info["style"])
    except Exception as exc:
        print(f"[warn] Gemini TTS failed ({exc}), falling back to Chirp 3 HD...", file=sys.stderr)
        engine_used = "chirp3-hd"
        audio_bytes = synthesize_chirp_fallback(token, args.text, voice_info["chirp_fallback"])

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = Path(tmp.name)

    try:
        duration_sec = post_process_audio(tmp_path, Path(args.out), tempo=args.tempo)
    finally:
        tmp_path.unlink(missing_ok=True)

    result = {
        "out": args.out,
        "voice": voice_name,
        "engine": engine_used,
        "duration_sec": round(duration_sec, 3),
        "tempo": args.tempo,
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
