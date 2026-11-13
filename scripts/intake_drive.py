#!/usr/bin/env python3
"""Parse Shopee Affiliate .txt briefs from Google Drive into structured product_<NO>.json."""

import argparse
import json
import re
import subprocess
from pathlib import Path


def download_drive_file(file_id: str, out_path: Path) -> str:
    subprocess.run(
        ["gdrive", "readonly", "download", file_id, "--out", str(out_path)],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    return out_path.read_text(encoding="utf-8", errors="replace")


def parse_brief_text(text: str, no: str, category: str = "ทั่วไป", price: int = 199, original_price: int | None = None) -> dict:
    name_m = re.search(r"ชื่อสินค้า:\s*(.+)", text)
    link_m = re.search(r"ลิงก์\s*Affiliate:\s*(https?://\S+)", text)
    bullets = [
        line.lstrip("•-* ").strip()
        for line in text.splitlines()
        if line.strip().startswith(("•", "-", "*"))
        and not re.match(r"^[-=*_]{3,}$", line.strip())
        and line.lstrip("•-* ").strip()
    ]
    hashtags = re.findall(r"#\S+", text)

    product_name = name_m.group(1).strip() if name_m else f"สินค้า #{no}"
    affiliate_link = link_m.group(1).strip() if link_m else ""

    # Extract hook/pain from the line right before bullets if available
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    pain_line = ""
    for i, l in enumerate(lines):
        if l.startswith(("•", "-", "*")) and i > 0:
            prev = lines[i - 1]
            if not prev.startswith(("=", "-", "📋", "🔗", "ชื่อสินค้า", "ลิงก์")):
                pain_line = prev
            break

    key_points = bullets[:4] if bullets else [product_name]
    narration_parts = [pain_line] if pain_line else [f"ใครกำลังมองหา {product_name} ห้ามพลาด!"]
    narration_parts.extend(key_points[:3])
    narration_parts.append(f"กดลิงก์ในไบโอ เลข {no} หรือคอมเมนต์ เอา ได้เลย!")

    return {
        "no": str(no),
        "product_name": product_name,
        "category": category,
        "price": price,
        "original_price": original_price,
        "hook_text": pain_line or f"ของมันต้องมี! {product_name[:28]}",
        "target_pain": key_points[0] if key_points else "",
        "key_points": key_points,
        "affiliate_link": affiliate_link,
        "dm_keyword": "เอา",
        "hashtags": hashtags,
        "narration_short": " ".join(narration_parts),
        "raw_images": [],
    }


def main():
    parser = argparse.ArgumentParser(description="Convert Drive .txt brief into product_<NO>.json")
    parser.add_argument("--drive-id", help="Google Drive file ID of .txt brief")
    parser.add_argument("--file", help="Local .txt brief path")
    parser.add_argument("--no", required=True, help="Product number (e.g. 128)")
    parser.add_argument("--category", default="ทั่วไป")
    parser.add_argument("--price", type=int, default=199)
    parser.add_argument("--original-price", type=int, default=None)
    parser.add_argument("--out", default=None, help="Output product JSON path")
    args = parser.parse_args()

    if args.drive_id:
        tmp = Path(f"/tmp/brief_{args.no}.txt")
        text = download_drive_file(args.drive_id, tmp)
    elif args.file:
        text = Path(args.file).read_text(encoding="utf-8")
    else:
        raise SystemExit("Provide --drive-id or --file")

    product = parse_brief_text(text, args.no, args.category, args.price, args.original_price)
    out_path = Path(args.out or f"data/product_{args.no}.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(product, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"out": str(out_path), "product_name": product["product_name"], "points": len(product["key_points"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
