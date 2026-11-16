#!/usr/bin/env python3
"""Automated QA Guard for rendered 9:16 Shopee Affiliate MP4 clips."""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def run_qa(video_path: Path, tier: str, extract_dir: Path | None = None) -> dict:
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    probe_raw = subprocess.check_output(
        [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", str(video_path),
        ],
        text=True,
    )
    probe = json.loads(probe_raw)
    streams = probe.get("streams", [])
    v_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    a_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)
    duration = float(probe.get("format", {}).get("duration", 0))

    issues = []
    if not v_stream:
        issues.append("Missing video stream")
    else:
        w, h = int(v_stream.get("width", 0)), int(v_stream.get("height", 0))
        if (w, h) != (1080, 1920):
            issues.append(f"Expected 1080x1920, got {w}x{h}")

    if not a_stream:
        issues.append("Missing audio stream")

    if tier == "short" and not (12.0 <= duration <= 32.0):
        issues.append(f"Short tier duration out of 12-32s range: {duration:.2f}s")
    elif tier == "long" and not (28.0 <= duration <= 62.0):
        issues.append(f"Long tier duration out of 28-62s range: {duration:.2f}s")
    elif tier == "howto" and duration < 15.0:
        issues.append(f"How-To tier duration too short (<15s): {duration:.2f}s")

    keyframes = []
    if extract_dir:
        extract_dir.mkdir(parents=True, exist_ok=True)
        for idx, ts in enumerate([1.2, duration * 0.45, max(duration - 1.5, 0.5)], start=1):
            out_img = extract_dir / f"{video_path.stem}_qa_{idx}.jpg"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-ss", f"{ts:.2f}", "-i", str(video_path),
                    "-vframes", "1", "-vf", "scale=360:-1", str(out_img),
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            keyframes.append(str(out_img))

    return {
        "video": str(video_path),
        "tier": tier,
        "duration_sec": round(duration, 2),
        "passed": len(issues) == 0,
        "issues": issues,
        "keyframes": keyframes,
    }


def main():
    parser = argparse.ArgumentParser(description="Run automated QA check on rendered MP4")
    parser.add_argument("--video", required=True, help="Path to MP4 file")
    parser.add_argument("--tier", choices=["short", "long", "howto"], default="short")
    parser.add_argument("--frames-dir", default="/tmp/qa_frames", help="Directory for extracted QA keyframes")
    args = parser.parse_args()

    report = run_qa(Path(args.video), args.tier, Path(args.frames_dir))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0 if report["passed"] else 1)


if __name__ == "__main__":
    main()
