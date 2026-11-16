# Affiliate Motion — Standard Clip Format & Production Pipeline (v16)

เอกสารมาตรฐานล่าสุดสำหรับการผลิตคลิป Shopee Affiliate แนวตั้ง `9:16` (`1080×1920`, `30fps`) เพื่อใช้ซ้ำกับสินค้าทุกชิ้น

> **กฎบังคับ (Mandatory 2-Clip Standard):** สินค้า 1 ชิ้น **ต้องผลิตคู่กัน 2 คลิปเสมอ** ก่อนส่งงาน:
> 1. **`#<NO>_short.mp4`** — คลิปสั้นขายจุดเด่น (`ProductClip`, 15–28 วินาที, **มีมาสคอต**)
> 2. **`#<NO>_howto.mp4`** — คลิป How-To แก้ปัญหา (`StoryHowToClip`, **ไม่จำกัดเวลา**, **ไม่มีมาสคอต**) แบบ Full-Bleed เต็มจอสมจริง **สร้างภาพ AI ใหม่ทั้งหมด 10–20 ช็อต**

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

## 2. รูปแบบคลิปที่ 2: How-To สมจริงเต็มจอ (`StoryHowToClip` — Problem → Solve → How-To → Before/After → CTA)

**กฎเหล็กสำหรับคลิป How-To (`StoryHowToClip`):**
- **Full-Bleed 100% ไม่มีกรอบการ์ด & ไม่มีมาสคอต:** ภาพทุกช็อตเต็มขอบ `1080×1920` เหมือนคนถ่ายจริงลง TikTok/Reels ไม่มีกรอบขาว/พื้นหลังเทมเพลต ไม่มีตัวการ์ตูนมาสคอต และไม่มีป้าย `"น้อง... ป้ายยาของเด็ด"` (ใช้ซับคาราโอเกะเต็มความกว้างแบบสะอาด)
- **สร้างภาพ AI ใหม่ทั้งหมด 10–20 ช็อต (`public/products/<NO>_howto/`):** ห้ามนำภาพเดิมที่อัปโหลดมาใช้ซ้ำตรงๆ (ส่งภาพสินค้าจริงเป็น Reference ให้สินค้าตรงรุ่นเท่านั้น) และต้องซอยมุมกล้องหลากหลาย (มุมกว้าง, มุมมือกำลังทำ, โคลสอัพจุดสำคัญ, รีแอคชัน):
  1. **Problem / Hook (2–3 ช็อต):** โชว์ปัญหาจริง + พาดหัวใหญ่ 3 ชั้น (`❌ ปัญหา...`)
  2. **The Solve (1–2 ช็อต):** โคลสอัพสินค้าที่จะมาแก้ปัญหา (`✨ THE SOLVE`)
  3. **How-To Steps (4–8 ช็อต):** สาธิตวิธีแก้ปัญหาทีละขั้น (เปลี่ยนมุมกล้องให้เห็นวิธีทำจริง)
  4. **Before vs After (1–2 ช็อต):** แบ่งครึ่งซ้าย-ขวาเทียบคน/ห้องเดิม (`BEFORE` vs `AFTER`)
  5. **Lineup / CTA (1–2 ช็อต):** โชว์ตัวเลือก/ขนาด + ปุ่มตะกร้า
- **คนแสดงคนเดียวกัน 100% ทั้งคลิป:** ล็อกหน้าตา ทรงผม ชุด และฉากห้องเดียวกันทุกช็อต (รวมถึงใน Before vs After)
- **จังหวะตัดต่อสบายตา ไม่เวียนหัว & ไม่จำกัดเวลา:** แต่ละช็อตยาวอย่างน้อย **2.5–4.5 วินาที** ซูมเข้า-ออกนุ่มๆ (`zoom_in` / `zoom_out`) ห้ามตัดเร็วแบบ 0.5–1 วินาที และไม่จำกัดความยาวคลิป (30–55 วินาทีได้ตามธรรมชาติของเรื่อง)
- **QC ตรงไปตรงมา ขั้นต่ำ 9.8 / 10:** ต้องตรวจเฟรมจริงทุกช่วงและให้คะแนนอย่างซื่อสัตย์ หากต่ำกว่า `9.8/10` ห้ามส่งงาน ต้องแก้จนผ่านก่อน

### กฎเหล็กด้านภาพ เสียง และ Safe Zone (ใช้กับทั้ง 2 คลิป)
- **Safe Zone 9:16:** เว้นบน `148px`, เว้นขอบขวาช่วงล่าง `104px` (กันปุ่ม TikTok/Reels/Shopee บังซับและปุ่มตะกร้า), เว้นล่าง `260px` สำหรับซับคาราโอเกะ
- **Zero-Clutter (ห้ามใส่ในคลิป):** ไม่มีลายน้ำ `@AffiliateMotion`, ไม่มีรหัส `#NO`, ไม่มีคำว่า *"กดลิงก์ในไบโอ"* หรือ *"คอมเมนต์ เอา"*
- **เสียงมาตรฐาน Broadcast:** เสียงพากย์ + เพลงพื้นหลังเบา + SFX ปรับความดังด้วย `ffmpeg loudnorm` เป้าหมาย **`-14 LUFS`** (True Peak `<= -1.5 dBTP`)

---

## 3. ขั้นตอนการผลิตคลิป (จบครบทั้ง 2 คลิป)

1. **โยนรูปเข้า Input (`TEMPLATE_INPUT` หรือส่งรูปในแชท)**
   - โยนรูปสินค้า 3–10 รูปลงในโฟลเดอร์ (ตั้งชื่อ เช่น `#134_ชื่อสินค้า`) — ไฟล์ `brief.txt` ใส่เฉพาะที่มีหรือไม่ใส่เลยก็ได้
2. **เตรียมภาพแยก 2 ชุด:**
   - ชุดที่ 1 (`public/products/<NO>/`) สำหรับ **Short Clip**: ครอปตัดขอบข้อความ/ลายน้ำ (`visual_prep.py`) + เจน `hero_fullbleed.jpg`
   - ชุดที่ 2 (`public/products/<NO>_howto/`) สำหรับ **How-To Clip**: เจนภาพ AI `9:16` ใหม่ทั้งหมด **10–20 ช็อต** คุมคนแสดงคนเดิมและห้องเดิมตลอดคลิป
3. **เรนเดอร์คลิปที่ 1 (`#<NO>_short.mp4`) ด้วย `batch_run.py`**
   ```bash
   python3 scripts/batch_run.py data/product_<NO>.json --tier short --cta-mode basket
   ```
4. **เรนเดอร์คลิปที่ 2 (`#<NO>_howto.mp4`) ด้วย `StoryHowToClip`**
   - สร้าง `vo_<NO>_howto_short.mp3` + `captions_<NO>_howto_short.json` + `props_<NO>_howto_short.json` แล้วเรนเดอร์:
   ```bash
   npx remotion render src/index.ts StoryHowToClip out/#<NO>_howto.mp4 --props=data/props_<NO>_howto_short.json --concurrency=100% --browser-executable=/usr/bin/chromium
   ffmpeg -y -i out/#<NO>_howto.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=7" -c:a aac -b:a 192k out/#<NO>_howto.norm.mp4 && mv out/#<NO>_howto.norm.mp4 out/#<NO>_howto.mp4
   python3 scripts/qa_check.py --video out/#<NO>_howto.mp4 --tier howto --frames-dir /tmp/qa_frames_<NO>_howto
   ```
5. **ตรวจภาพ QA แบบตรงไปตรงมา (≥ 9.8/10) + อัปโหลดส่งงานขึ้น Google Drive**
   ```bash
   gdrive mutate upload out/#<NO>_short.mp4 --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   gdrive mutate upload out/#<NO>_howto.mp4 --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   gdrive mutate upload out/#<NO>_cover.jpg --parent 1MV3E8bIRQu775rHGnlPJVW_GnriNOedW
   ```
