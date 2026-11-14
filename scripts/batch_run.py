#!/usr/bin/env python3
"""Fast batch runner for Affiliate Motion:
Pre-bundles Remotion once, renders 9:16 MP4 with multi-core concurrency,
generates cover thumbnail (#NO_cover.jpg), and runs automated QA."""

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THEMES = ["flash_sale", "clean_pastel", "modern_tech", "warm_home"]
LAYOUTS = ["card_center", "split_top", "floating_badge", "feature_carousel"]


def run(cmd: list[str], cwd: Path = ROOT) -> str:
    res = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, check=True)
    return res.stdout.strip()


def ensure_bundle(bundle_dir: Path) -> Path:
    if not (bundle_dir / "index.html").exists():
        run(["npx", "remotion", "bundle", "src/index.ts", "--out-dir", str(bundle_dir)])
    return bundle_dir


def sync_public_to_bundle(bundle_dir: Path):
    import shutil
    shutil.copytree(ROOT / "public", bundle_dir / "public", dirs_exist_ok=True)


def pick_mascot_by_category(category: str) -> str:
    import re
    c = (category or "").lower()
    if re.search(r"ความงาม|สกินแคร์|เครื่องสำอาง|แฟชั่น|beauty|skincare|cosmetic|fashion", c):
        return "mini"
    if re.search(r"ไอที|แก็ดเจ็ต|เครื่องมือ|อิเล็กทรอนิกส์|it|gadget|tech|tool|electronic", c):
        return "max"
    if re.search(r"สัตว์เลี้ยง|ไลฟ์สไตล์|ของขวัญ|น่ารัก|pet|lifestyle|cute|gift", c):
        return "sky_cat"
    return "star_bear"


def process_product(product_path: Path, idx: int, tier: str, bundle_dir: Path, cta_mode: str):
    product = json.loads(product_path.read_text(encoding="utf-8"))
    no = str(product["no"])
    narration = product.get(f"narration_{tier}") or product.get("narration_short") or ""
    if not narration:
        raise ValueError(f"Missing narration_{tier} in {product_path}")

    theme_id = product.get("themeId") or THEMES[idx % len(THEMES)]
    layout_variant = product.get("layoutVariant") or LAYOUTS[idx % len(LAYOUTS)]
    mascot_id = product.get("mascotId") or pick_mascot_by_category(product.get("category", "ทั่วไป"))

    # 1. Visual Prep + dominant color extraction (or honor pre-staged images if provided)
    top_crop_pct = float(product.get("top_crop_pct", 0.0))
    images = list(product.get("staged_images", []))
    custom_accent = product.get("custom_accent")
    if not images:
        raw_images = product.get("raw_images", [])
        for img_idx, raw_img in enumerate(raw_images, start=1):
            out_json = run([
                "python3", "scripts/visual_prep.py",
                "--src", raw_img,
                "--out-dir", "public",
                "--prefix", f"{no}_vis_{img_idx}",
                *(["--top-crop-pct", str(top_crop_pct)] if top_crop_pct > 0 else []),
                *(["--crops"] if len(raw_images) == 1 else []),
            ])
            vis = json.loads(out_json)
            images.extend(vis["files"])
            if img_idx == 1 and product.get("use_auto_accent"):
                custom_accent = vis.get("accent_hex")

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

    # 3. Captions (Anchor-word STT alignment)
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
        "brandLabel": product.get("brand_label"),
        "gridHeadline": product.get("grid_headline"),
        "problemText": product.get("target_pain", ""),
        "keyPoints": product.get("key_points", []),
        "spotlightTitle": product.get("spotlight_title"),
        "decisionHelper": product.get("decision_helper"),
        "swatchHighlights": product.get("swatch_highlights"),
        "howToSteps": product.get("how_to_steps"),
        "ctaHeadline": product.get("cta_headline"),
        "ctaText": product.get("cta_text", "🛒 กดดูสินค้าจากตะกร้าได้เลย!"),
        "ctaMode": cta_mode,
        "dmKeyword": product.get("dm_keyword", ""),
        "brandHandle": product.get("brand_handle", ""),
        "themeId": theme_id,
        "layoutVariant": layout_variant,
        "mascotId": mascot_id,
        "customAccent": custom_accent,
        "images": images,
        "heroFullBleedImage": product.get("hero_fullbleed_image"),
        "heroCalloutImage": product.get("hero_callout_image"),
        "heroCalloutLabel": product.get("hero_callout_label"),
        "heroBadges": product.get("hero_badges"),
        "voiceoverFile": vo_rel,
        "captions": caps["lines"],
        "durationInSec": caps["duration_sec"] + 0.5,
        "enableSfx": True,
    }
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")

    # Sync newly generated visuals & voiceover into pre-built bundle
    sync_public_to_bundle(bundle_dir)

    # 5. Fast Remotion Render using pre-built bundle + 100% concurrency
    mp4_path = ROOT / "out" / f"#{no}_{tier}.mp4"
    run([
        "npx", "remotion", "render", str(bundle_dir), "ProductClip",
        str(mp4_path),
        f"--props={props_path}",
        "--concurrency=100%",
        "--browser-executable=/usr/bin/chromium",
    ])

    # 5b. Normalize audio stream cleanly to -14 LUFS broadcast target (video stream copy)
    norm_path = ROOT / "out" / f"#{no}_{tier}.norm.mp4"
    run([
        "ffmpeg", "-y", "-i", str(mp4_path),
        "-c:v", "copy",
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=7",
        "-c:a", "aac", "-b:a", "192k",
        str(norm_path),
    ])
    norm_path.replace(mp4_path)

    # 6. Auto Cover Thumbnail
    cover_path = ROOT / "out" / f"#{no}_cover.jpg"
    run([
        "npx", "remotion", "still", str(bundle_dir), "ProductClip",
        str(cover_path),
        "--frame=24",
        f"--props={props_path}",
        "--browser-executable=/usr/bin/chromium",
    ])

    # 7. QA Check
    qa_out = run([
        "python3", "scripts/qa_check.py",
        "--video", str(mp4_path),
        "--tier", tier,
        "--frames-dir", "/tmp/qa_frames_v2",
    ])
    print(qa_out)


def main():
    parser = argparse.ArgumentParser(description="Fast batch runner for Affiliate Motion")
    parser.add_argument("products", nargs="+", help="Path(s) to product_<NO>.json")
    parser.add_argument("--tier", choices=["short", "long"], default="short")
    parser.add_argument("--cta-mode", choices=["bio", "basket"], default="basket")
    parser.add_argument("--bundle-dir", default="/tmp/remotion_bundle")
    args = parser.parse_args()

    bundle_dir = ensure_bundle(Path(args.bundle_dir))
    for idx, p in enumerate(args.products):
        process_product(Path(p), idx, args.tier, bundle_dir, args.cta_mode)


if __name__ == "__main__":
    main()
