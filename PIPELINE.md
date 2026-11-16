# Affiliate Motion — Standard Clip Format & Production Pipeline (v15)

เอกสารมาตรฐานล่าสุดสำหรับการผลิตคลิป Shopee Affiliate แนวตั้ง `9:16` (`1080×1920`, `30fps`) เพื่อใช้ซ้ำกับสินค้าทุกชิ้น

> **กฎบังคับ (Mandatory 2-Clip Standard):** สินค้า 1 ชิ้น **ต้องผลิตคู่กัน 2 คลิปเสมอ** ก่อนส่งงาน:
> 1. **`#<NO>_short.mp4`** — คลิปสั้นขายจุดเด่น (`ProductClip`, 15–28 วินาที)
> 2. **`#<NO>_howto.mp4`** — คลิป How-To แก้ปัญหา (`HowToClip`, 20–30 วินาที) โดย **ต้องสร้างภาพ AI 9:16 ใหม่ทั้งหมด** ห้ามนำภาพเดิมที่อัปโหลดมาใช้ซ้ำตรงๆ

---

## 1. รูปแบบคลิปที่ 1: Short ขายจุดเด่น (`ProductClip` — 4-Scene Commercial)

ทุกคลิปจะถูกจัดวางตามจังหวะเสียงพากย์จริงอัตโนมัติ ([`computeSceneBounds`](file:///home/antigravity/Alongkornjo/affiliate-motion/src/compositions/ProductClip.tsx#L59-L110)) แบ่งเป็น 4 ซีน:

| ซีน | ช่วงเวลา (Short 20–28s) | ภาพหลัก & เลย์เอาต์ | ข้อความและลูกเล่นบนจอ | มาสคอต (มุมซ้ายล่าง) |
| :--- | :--- | :--- | :--- | :--- |
| **Scene 1: Hook** | `0% – ~24%` | ภาพ `hero_fullbleed` เต็มจอ + การ์ด PiP มุมขวาบนโชว์จุดขาย Macro (`hero_callout_image`) | พาดหัว 2 บรรทัด + ชื่อแบรนด์แบบไม่มีกรอบ (`brand_label`) + แถบ 3 จุดเด่น (`hero_badges`) | **เต็มตัว (`wave.png`)** เดินเปิดตัว |
| **Scene 2: Feature Grid** | `~24% – ~56%` | ภาพสินค้า/นางแบบเต็มกรอบ `100%` (`model_clean` / `grid_clean`) | แถบจุดเด่น 3 ข้อเรียงตรงแนว ขึ้นครบเร็ว + ไฮไลต์สลับตามเสียง + หัวมาสคอตหมุนในข้อที่กำลังพูด | **หัวดุ๊กดิ๊ก (`head_excited.png`)** ในวงกลม `216px` |
| **Scene 3: Spotlight / Shades** | `~56% – ~78%` | ชาร์ตสวอช/รายละเอียด (`swatches_clean`) แล้วตัดเข้ารูปผลลัพธ์ (`model_clean`) หลังจบเฉดสีสุดท้าย (`spotMid`) | วงแหวนชี้สี + ป้ายชื่อ + แถบปุ่ม 3 สีสว่างสลับตามเวลา `swatchHighlights` + เสียง `pop.wav` | **หัวดุ๊กดิ๊ก (`head_love.png`)** ในวงกลม `216px` |
| **Scene 4: Conversion CTA** | `~78% – 100%` | ภาพรวม 4 ช่องเต็มความกว้าง `100%` (`grid_clean`) | แถบวิธีใช้ `1-2-3` + ปุ่มตะกร้าไล่สีมีแสง Shimmer + ลูกศรชี้ลงเด้งจังหวะ | **เต็มตัวถือตะกร้า (`basket.png`)** |

---

## 2. รูปแบบคลิปที่ 2: How-To แก้ปัญหา (`HowToClip` — Problem → Solve → Result → CTA)

**กฎเหล็กสำหรับคลิป How-To:**
- **สร้างภาพใหม่ทั้งหมด 100% (`public/products/<NO>_howto/`):** ห้ามนำภาพเดิมที่ผู้ใช้อัปโหลดหรือภาพจากโฟลเดอร์ Short (`public/products/<NO>/`) มาใส่ตรงๆ — ต้องใช้ `generate_image` (`9:16`) เจนฉากใหม่ทั้งหมด โดยส่งภาพสินค้าจริงเป็น Reference เพื่อให้สินค้าหน้าตาตรงรุ่นเท่านั้น
- **โครงเรื่องต้องเป็นการแก้ปัญหา (Problem-Solving):**
  1. **Intro / Problem (`0% – ~20%`):** โชว์ปัญหาที่เกิดขึ้นจริงก่อนใช้สินค้า (เช่น มุมห้องโล่ง/ดูจืด, กิ่งไม้แบนฟีบ, ตั้งไม่มั่นคง)
  2. **Step 1 (`~20% – ~42%`):** วิธีแก้ขั้นที่ 1 (เช่น ประกอบฐาน/แกนให้มั่นคง)
  3. **Step 2 (`~42% – ~65%`):** วิธีแก้ขั้นที่ 2 (เช่น คลี่กิ่งทีละชั้นให้ฟูแน่น)
  4. **Step 3 / Result (`~65% – ~84%`):** วิธีแก้ขั้นที่ 3 & ผลลัพธ์หลังแก้ปัญหาเสร็จ (มุมห้องสวยอบอุ่น)
  5. **CTA (`~84% – 100%`):** ปิดการขาย *"กดดูสินค้าจากตะกร้าได้เลย!"*

### กฎเหล็กด้านภาพ เสียง และ Safe Zone (ใช้กับทั้ง 2 คลิป)
- **Safe Zone 9:16:** เว้นบน `148px`, เว้นขอบขวาช่วงล่าง `104px` (กันปุ่ม TikTok/Reels/Shopee บังซับและปุ่มตะกร้า), เว้นล่าง `260px` สำหรับซับคาราโอเกะและมาสคอต
- **Zero-Clutter (ห้ามใส่ในคลิป):** ไม่มีลายน้ำ `@AffiliateMotion`, ไม่มีรหัส `#NO`, ไม่มีป้ายหมวดหมู่แยกเหนือพาดหัว, และไม่พูด/ขึ้นคำว่า *"กดลิงก์ในไบโอ"* หรือ *"คอมเมนต์ เอา"*
- **เสียงมาตรฐาน Broadcast:** เสียงพากย์ Gemini 2.5 Flash TTS + เพลงพื้นหลังเบา (`0.075`) + SFX (`pop`, `whoosh`, `ding`, `sparkle`) ปรับความดังด้วย `ffmpeg loudnorm` เป้าหมาย **`-14 LUFS`** (True Peak `<= -1.5 dBTP`)

---

## 3. ขั้นตอนการผลิตคลิป (จบครบทั้ง 2 คลิป)

1. **โยนรูปเข้า Input (`TEMPLATE_INPUT` หรือส่งรูปในแชท)**
   - โยนรูปสินค้า 3–10 รูปลงในโฟลเดอร์ที่ก๊อปปี้จาก `TEMPLATE_INPUT` (ตั้งชื่อ เช่น `#134_ชื่อสินค้า`) — ไฟล์ `brief.txt` ใส่เฉพาะที่มีหรือไม่ใส่เลยก็ได้
2. **เตรียมภาพแยก 2 ชุด:**
   - ชุดที่ 1 (`public/products/<NO>/`) สำหรับ **Short Clip**: ครอปตัดขอบข้อความ/ลายน้ำ (`visual_prep.py`) + เจน `hero_fullbleed.jpg`
   - ชุดที่ 2 (`public/products/<NO>_howto/`) สำหรับ **How-To Clip**: เจนภาพใหม่ `9:16` ครบทุกซีน (Problem → Step 1 → Step 2 → Step 3/Result) โดยคุมคาแรกเตอร์/ห้อง/แสงให้ต่อเนื่องกัน
3. **เรนเดอร์คลิปที่ 1 (`#<NO>_short.mp4`) ด้วย `batch_run.py`**
   ```bash
   python3 scripts/batch_run.py data/product_<NO>.json --tier short --cta-mode basket
   ```
4. **เรนเดอร์คลิปที่ 2 (`#<NO>_howto.mp4`) ด้วย `HowToClip`**
   - สร้าง `vo_<NO>_howto_short.mp3` + `captions_<NO>_howto_short.json` + `props_<NO>_howto_short.json` แล้วเรนเดอร์:
   ```bash
   npx remotion render src/index.ts HowToClip out/#<NO>_howto.mp4 --props=data/props_<NO>_howto_short.json --concurrency=100% --browser-executable=/usr/bin/chromium
   ffmpeg -y -i out/#<NO>_howto.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=7" -c:a aac -b:a 192k out/#<NO>_howto.norm.mp4 && mv out/#<NO>_howto.norm.mp4 out/#<NO>_howto.mp4
   python3 scripts/qa_check.py --video out/#<NO>_howto.mp4 --tier short --frames-dir /tmp/qa_frames_howto
   ```
5. **ตรวจภาพ QA + อัปโหลดส่งงานขึ้น Google Drive**
   ```bash
   gdrive mutate upload out/#<NO>_short.mp4 --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   gdrive mutate upload out/#<NO>_howto.mp4 --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   gdrive mutate upload out/#<NO>_cover.jpg --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   ```
