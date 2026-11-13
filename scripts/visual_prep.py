#!/usr/bin/env python3
"""Prepare product images for Remotion: resize, optional white-background cutout, and spotlight detail crops."""

import argparse
import json
from pathlib import Path

from PIL import Image


def remove_near_white_bg(img: Image.Image, threshold: int = 242) -> Image.Image:
    rgba = img.convert("RGBA")
    datas = rgba.getdata()
    new_data = []
    for r, g, b, a in datas:
        if r >= threshold and g >= threshold and b >= threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    rgba.putdata(new_data)
    return rgba


def prepare_image(src: Path, out_dir: Path, prefix: str, cutout: bool = False, create_crops: bool = False) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    img = Image.open(src).convert("RGB")
    outputs = []

    # Main normalized image (max 1080px)
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
        # Center-top detail crop for multi-scene variety
        crop_box = (int(w * 0.12), int(h * 0.08), int(w * 0.88), int(h * 0.82))
        detail = img.crop(crop_box)
        detail_out = out_dir / f"{prefix}_detail.jpg"
        detail.save(detail_out, "JPEG", quality=90)
        outputs.append(detail_out.name)

    return outputs


def main():
    parser = argparse.ArgumentParser(description="Prepare product visuals for Remotion")
    parser.add_argument("--src", required=True, help="Source image path")
    parser.add_argument("--out-dir", default="public", help="Output directory")
    parser.add_argument("--prefix", required=True, help="Output filename prefix")
    parser.add_argument("--cutout", action="store_true", help="Remove near-white background to transparent PNG")
    parser.add_argument("--crops", action="store_true", help="Generate spotlight detail crop")
    args = parser.parse_args()

    files = prepare_image(Path(args.src), Path(args.out_dir), args.prefix, args.cutout, args.crops)
    print(json.dumps({"files": files}))


if __name__ == "__main__":
    main()
