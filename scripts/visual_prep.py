#!/usr/bin/env python3
"""Prepare product images for Remotion: resize, optional white-background cutout,
multiple spotlight detail crops, and dominant color extraction."""

import argparse
import colorsys
import json
from pathlib import Path

from PIL import Image


def extract_accent_hex(img: Image.Image) -> str:
    """Find a vibrant non-gray dominant color from the product image."""
    small = img.convert("RGB").resize((64, 64))
    best_score = -1.0
    best_rgb = (238, 77, 45)
    for r, g, b in small.getdata():
        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        if v < 0.25 or v > 0.94 or s < 0.28:
            continue
        score = s * (1.0 - abs(v - 0.65))
        if score > best_score:
            best_score = score
            best_rgb = (r, g, b)
    return "#{:02X}{:02X}{:02X}".format(*best_rgb)


def remove_near_white_bg(img: Image.Image, threshold: int = 242) -> Image.Image:
    rgba = img.convert("RGBA")
    new_data = [
        (r, g, b, 0) if (r >= threshold and g >= threshold and b >= threshold) else (r, g, b, a)
        for r, g, b, a in rgba.getdata()
    ]
    rgba.putdata(new_data)
    return rgba


def prepare_image(
    src: Path,
    out_dir: Path,
    prefix: str,
    cutout: bool = False,
    create_crops: bool = False,
    top_crop_pct: float = 0.0,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    img = Image.open(src).convert("RGB")
    if top_crop_pct > 0.0 and top_crop_pct < 0.5:
        w0, h0 = img.size
        img = img.crop((0, int(h0 * top_crop_pct), w0, h0))
    accent_hex = extract_accent_hex(img)
    outputs = []

    img.thumbnail((1080, 1080), Image.Resampling.LANCZOS)
    if cutout:
        cut_img = remove_near_white_bg(img)
        main_out = out_dir / f"{prefix}.png"
        cut_img.save(main_out, "PNG")
    else:
        main_out = out_dir / f"{prefix}.jpg"
        img.save(main_out, "JPEG", quality=92)
    outputs.append(main_out.name)

    if create_crops:
        w, h = img.size
        # Crop 1: upper-center product focus
        crop1 = img.crop((int(w * 0.14), int(h * 0.06), int(w * 0.86), int(h * 0.72)))
        c1_out = out_dir / f"{prefix}_detail1.jpg"
        crop1.save(c1_out, "JPEG", quality=90)
        outputs.append(c1_out.name)

        # Crop 2: lower-center lifestyle/base focus
        crop2 = img.crop((int(w * 0.10), int(h * 0.28), int(w * 0.90), int(h * 0.94)))
        c2_out = out_dir / f"{prefix}_detail2.jpg"
        crop2.save(c2_out, "JPEG", quality=90)
        outputs.append(c2_out.name)

    return {"files": outputs, "accent_hex": accent_hex}


def main():
    parser = argparse.ArgumentParser(description="Prepare product visuals for Remotion")
    parser.add_argument("--src", required=True, help="Source image path")
    parser.add_argument("--out-dir", default="public", help="Output directory")
    parser.add_argument("--prefix", required=True, help="Output filename prefix")
    parser.add_argument("--cutout", action="store_true", help="Remove near-white background to transparent PNG")
    parser.add_argument("--crops", action="store_true", help="Generate 2 spotlight detail crops")
    parser.add_argument("--top-crop-pct", type=float, default=0.0, help="Trim top fraction (e.g. 0.06) to strip catalog header")
    args = parser.parse_args()

    res = prepare_image(
        Path(args.src),
        Path(args.out_dir),
        args.prefix,
        args.cutout,
        args.crops,
        args.top_crop_pct,
    )
    print(json.dumps(res))


if __name__ == "__main__":
    main()
