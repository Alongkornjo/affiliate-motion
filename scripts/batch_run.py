#!/usr/bin/env python3
"""Batch runner for Affiliate Motion: takes product JSON(s) and runs
visual_prep -> voiceover -> captions -> remotion render -> qa_check."""

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THEMES = ["flash_sale", "clean_pastel", "modern_tech", "warm_home"]
LAYOUTS = ["card_center", "split_top", "floating_badge", "feature_carousel"]


def run(cmd: list[str], cwd: Path = ROOT) -> str:
    res = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, check=True)
    return res.stdout.strip()


def process_product(product_path: Path, idx: int, tier: str = "short"):
    product = json.loads(product_path.read_text(encoding="utf-8"))
    no = str(product["no"])
    narration = product.get(f"narration_{tier}") or product.get("narration_short") or ""
    if not narration:
        raise ValueError(f"Missing narration_{tier} in {product_path}")

    theme_id = product.get("themeId") or THEMES[idx % len(THEMES)]
    layout_variant = product.get("layoutVariant") or LAYOUTS[idx % len(LAYOUTS)]

    # 1. Visual Prep
    images = []
    raw_images = product.get("raw_images", [])
    for img_idx, raw_img in enumerate(raw_images, start=1):
        out_json = run([
            "python3", "scripts/visual_prep.py",
            "--src", raw_img,
            "--out-dir", "public",
            "--prefix", f"{no}_vis_{img_idx}",
            *(["--crops"] if len(raw_images) == 1 else []),
        ])
        images.extend(json.loads(out_json)["files"])

    # 2. Voiceover
    vo_rel = f"vo_{no}_{tier}.mp3"
    vo_out = f"public/{vo_rel}"
    run([
        "uv", "run", "--with", "google-auth", "--with", "requests",
        "python3", "scripts/voiceover.py",
        "--text", narration,
        "--category", product.get("category", "ทั่วไป"),
        "--out", vo_out,
    ])

    # 3. Captions
    cap_path = ROOT / "data" / f"captions_{no}_{tier}.json"
    run([
        "uv", "run", "--with", "google-auth", "--with", "requests",
        "python3", "scripts/captions.py",
        "--script", narration,
        "--audio", vo_out,
        "--out", str(cap_path),
    ])
    caps = json.loads(cap_path.read_text(encoding="utf-8"))

    # 4. Props JSON
    props_path = ROOT / "data" / f"props_{no}_{tier}.json"
    props = {
        "no": no,
        "productName": product["product_name"],
        "category": product.get("category", "ทั่วไป"),
        "price": product["price"],
        "originalPrice": product.get("original_price"),
        "hookText": product.get("hook_text", product["product_name"]),
        "problemText": product.get("target_pain", ""),
        "keyPoints": product.get("key_points", []),
        "ctaText": product.get("cta_text", f'กดลิงก์ในไบโอ เลข #{no} · หรือเม้น "{product.get("dm_keyword", "เอา")}"'),
        "dmKeyword": product.get("dm_keyword", "เอา"),
        "brandHandle": product.get("brand_handle", "@AffiliateMotion"),
        "themeId": theme_id,
        "layoutVariant": layout_variant,
        "images": images,
        "voiceoverFile": vo_rel,
        "captions": caps["lines"],
        "durationInSec": caps["duration_sec"] + 0.5,
        "enableSfx": True,
    }
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")

    # 5. Remotion Render
    mp4_path = ROOT / "out" / f"#{no}_{tier}.mp4"
    run([
        "npx", "remotion", "render", "src/index.ts", "ProductClip",
        str(mp4_path),
        f"--props={props_path}",
        "--browser-executable=/usr/bin/chromium",
    ])

    # 6. QA Check
    qa_out = run([
        "python3", "scripts/qa_check.py",
        "--video", str(mp4_path),
        "--tier", tier,
    ])
    print(qa_out)


def main():
    parser = argparse.ArgumentParser(description="Run Affiliate Motion pipeline for product JSON(s)")
    parser.add_argument("products", nargs="+", help="Path(s) to product_<NO>.json")
    parser.add_argument("--tier", choices=["short", "long"], default="short")
    args = parser.parse_args()

    for idx, p in enumerate(args.products):
        process_product(Path(p), idx, tier=args.tier)


if __name__ == "__main__":
    main()
