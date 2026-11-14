# Affiliate Motion — Standard Clip Format & Production Pipeline (v13)

เอกสารมาตรฐานล่าสุดสำหรับการผลิตคลิป Shopee Affiliate แนวตั้ง `9:16` (`1080×1920`, `30fps`) เพื่อใช้ซ้ำกับสินค้าทุกชิ้น

---

## 1. รูปแบบคลิปมาตรฐาน (4-Scene Commercial Structure)

ทุกคลิปจะถูกจัดวางตามจังหวะเสียงพากย์จริงอัตโนมัติ ([`computeSceneBounds`](file:///home/antigravity/affiliate-motion/src/compositions/ProductClip.tsx#L59-L110)) แบ่งเป็น 4 ซีน:

| ซีน | ช่วงเวลา (Short 20–28s) | ภาพหลัก & เลย์เอาต์ | ข้อความและลูกเล่นบนจอ | มาสคอต (มุมซ้ายล่าง) |
| :--- | :--- | :--- | :--- | :--- |
| **Scene 1: Hook** | `0% – ~24%` | ภาพ `hero_fullbleed` เต็มจอ + การ์ด PiP มุมขวาบนโชว์จุดขาย Macro (`hero_callout_image`) | พาดหัว 2 บรรทัด + ชื่อแบรนด์แบบไม่มีกรอบ (`brand_label`) + แถบ 3 จุดเด่น (`hero_badges`) | **เต็มตัว (`wave.png`)** เดินเปิดตัว |
| **Scene 2: Feature Grid** | `~24% – ~56%` | ภาพสินค้า/นางแบบเต็มกรอบ `100%` (`model_clean` / `grid_clean`) | แถบจุดเด่น 3 ข้อเรียงตรงแนว ขึ้นครบเร็ว + ไฮไลต์สลับตามเสียง + หัวมาสคอตหมุนในข้อที่กำลังพูด | **หัวดุ๊กดิ๊ก (`head_excited.png`)** ในวงกลม `216px` |
| **Scene 3: Spotlight / Shades** | `~56% – ~78%` | ชาร์ตสวอช/รายละเอียด (`swatches_clean`) แล้วตัดเข้ารูปผลลัพธ์ (`model_clean`) หลังจบเฉดสีสุดท้าย (`spotMid`) | วงแหวนชี้สี + ป้ายชื่อ + แถบปุ่ม 3 สีสว่างสลับตามเวลา `swatchHighlights` + เสียง `pop.wav` | **หัวดุ๊กดิ๊ก (`head_love.png`)** ในวงกลม `216px` |
| **Scene 4: Conversion CTA** | `~78% – 100%` | ภาพรวม 4 ช่องเต็มความกว้าง `100%` (`grid_clean`) | แถบวิธีใช้ `1-2-3` + ปุ่มตะกร้าไล่สีมีแสง Shimmer + ลูกศรชี้ลงเด้งจังหวะ | **เต็มตัวถือตะกร้า (`basket.png`)** |

### กฎเหล็กด้านภาพ เสียง และ Safe Zone
- **Safe Zone 9:16:** เว้นบน `148px`, เว้นขอบขวาช่วงล่าง `104px` (กันปุ่ม TikTok/Reels/Shopee บังซับและปุ่มตะกร้า), เว้นล่าง `260px` สำหรับซับคาราโอเกะและมาสคอต
- **Zero-Clutter (ห้ามใส่ในคลิป):** ไม่มีลายน้ำ `@AffiliateMotion`, ไม่มีรหัส `#NO`, ไม่มีป้ายหมวดหมู่แยกเหนือพาดหัว, และไม่พูด/ขึ้นคำว่า *"กดลิงก์ในไบโอ"* หรือ *"คอมเมนต์ เอา"*
- **เสียงมาตรฐาน Broadcast:** เสียงพากย์ Gemini 2.5 Flash TTS + เพลงพื้นหลังเบา (`0.075`) + SFX (`pop`, `whoosh`, `ding`, `sparkle`) ปรับความดังด้วย `ffmpeg loudnorm` เป้าหมาย **`-14 LUFS`** (True Peak `<= -1.5 dBTP`)

---

## 2. ขั้นตอนการผลิตคลิป (5 ขั้นตอนจบ)

1. **เตรียมข้อมูลสินค้า (`data/product_<NO>.json`)**
   - ระบุข้อมูลสินค้า, ราคา, หมวดหมู่ (`category` เพื่อเลือกมาสคอต `mini` / `max` / `sky_cat` / `star_bear` อัตโนมัติ), บทพากย์ `narration_short` / `narration_long`, `brand_label`, `hook_text`, `hero_badges`, `key_points`, `how_to_steps`, และ `swatch_highlights` (ถ้ามี)
2. **เตรียมภาพสะอาด (`public/products/<NO>/`)**
   - ใช้ `scripts/visual_prep.py --top-crop-pct 0.06` เพื่อตัดขอบข้อความ/ลายน้ำแคตตาล็อกด้านบน หรือจัดเตรียมภาพครอปสะอาด (`hero_fullbleed.jpg`, Macro PiP, `swatches_clean.jpg`, `model_clean.jpg`, `grid_clean.jpg`)
3. **รัน Pipeline อัตโนมัติคำสั่งเดียว (`scripts/batch_run.py`)**
   ```bash
   python3 scripts/batch_run.py data/product_<NO>.json --tier short --cta-mode basket
   ```
   คำสั่งนี้จะสร้างเสียงพากย์ (`voiceover.py`) → ตัดคำซับคาราโอเกะ (`captions.py`) → สร้าง `props_<NO>_short.json` → เรนเดอร์ MP4 (`ProductClip`) → ปรับเสียง `-14 LUFS` → เรนเดอร์ภาพปก (`#NO_cover.jpg`) → รัน `qa_check.py` ให้อัตโนมัติ
4. **ตรวจภาพ QA ข้ามซีน**
   - ตรวจไฟล์ใน `/tmp/qa_frames_v2/` และเฟรมช่วง `swatchHighlights` + จุดตัด `spotMid` เพื่อเช็กความคมชัดและการไม่ซ้อนทับ
5. **อัปโหลดส่งงานขึ้น Google Drive**
   ```bash
   gdrive mutate upload out/#<NO>_short.mp4 --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   gdrive mutate upload out/#<NO>_cover.jpg --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   ```
