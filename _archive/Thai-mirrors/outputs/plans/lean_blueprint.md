# แผนแม่บทสถาปัตยกรรมแบบลีนและ Direct API (Master Lean Direct API Blueprint)

## 1. บทสรุปผู้บริหาร (Executive Summary)
ระบบปฏิบัติการ Coprem ขับเคลื่อนบนสถาปัตยกรรม "No-Middleman Direct API Architecture" (สถาปัตยกรรมแบบลีน/โอเพนซอร์ส) โดยตัดซอฟต์แวร์ SaaS และตัวกลางออกทั้งหมด
กระบวนการไหลของงาน (Flow): คุณเปรม (`Approved`) -> Jeff -> สคริปต์ระบบ (`system/scripts/`) -> การประมวลผลข้อมูลในเครื่องและ Cloud APIs โดยตรง

## 2. โครงสร้างพื้นฐาน (Infrastructure)
- **`.env.vault`**: ไฟล์เก็บกุญแจความปลอดภัยและโทเคนส่วนตัวแบบเข้ารหัสในเครื่อง (เส้นทาง Obsidian, เส้นทางฐานข้อมูล DB, ลิงก์ GAS URL, คีย์ LINE/โซเชียลมีเดีย)
- **SQLite DB (`system/db/Coprem.db`)**: ฐานข้อมูลภายในระบบสำหรับติดตามผลลัพธ์ งานที่มอบหมาย รายชื่อผู้ติดต่อ และฐานข้อมูลข้อมูลข่าวสารอัจฉริยะ (Intel) โดยเชื่อมต่อการแสดงภาพผ่าน NocoDB
- **Obsidian**: เชื่อมต่อการอ่านและเขียนไฟล์ Markdown โดยตรงในเครื่องผ่านสคริปต์ `obsidian_io.py`

## 3. สคริปต์เชื่อมต่อตรง (Direct Integration Scripts in `system/scripts/`)
- **`sqlite_io.py`**: ใช้คิวรีและอัปเดตฐานข้อมูล SQLite ภายในเครื่อง (`init`, `read`, `insert`)
- **`obsidian_io.py`**: จัดการการอ่าน/เขียนไฟล์ markdown ภายใน Obsidian Vault และจะใส่แสตมป์เวลาทุกครั้งที่มีการแก้ไข
- **`google_apps_trigger.py`**: ทางผ่านความปลอดภัยเชื่อมต่อ Google Apps Script (GAS) เพื่อสั่งงาน Google Drive, Gmail, Docs, และ Calendar ผ่านระบบ Webhook
- **`social_broadcast.py`**: โพสต์คอนเทนต์โดยตรงผ่านระบบ OAuth/Graph API ไปยังช่องทางโซเชียลมีเดีย (Facebook, Instagram, X v2, TikTok)
- **`line_oa_broadcast.py`**: บรอดแคสต์ข้อความผ่าน LINE OA Messaging API (Broadcast, Push, Multicast)

## 4. ข้อตกลงความปลอดภัยโดยมนุษย์ (HITL Protocol)
1. ห้ามให้ระบบอัตโนมัติ (Autonomous Write/Broadcast) ทำงานเขียนหรือบรอดแคสต์โดยไม่ได้รับอนุญาต
2. บรรดาตัวแทนเอเจนต์ (Agents) ต้องเขียนสรุปแผนการดำเนินการลงใน "รายงานสรุปของผู้บริหาร (Executive Summary Report)"
3. **การสั่งทำงาน:** สคริปต์จะถูกเรียกใช้งานก็ต่อเมื่อคุณเปรมพิมพ์คำอนุมัติว่า `Approved` เท่านั้น

## 5. ตารางเชื่อมโยงการทำงาน (Connector Matrix)
| ตัวเชื่อมโยง (Connector) | สิทธิ์การเข้าถึง | เอเจนต์ที่รับผิดชอบ | สคริปต์ที่เรียกใช้งาน |
|---|---|---|---|
| Obsidian | อ่าน/เขียน (R/W) | Archie, Libby, Newy | `obsidian_io.py` |
| SQLite | อ่าน/เขียน (R/W) | Archie, Libby, Newy, Zane, Chloe, Stella, Marco | `sqlite_io.py` |
| GAS | แบบมีปฏิสัมพันธ์ | Archie, Libby, Newy | `google_apps_trigger.py` |
| LINE/Socials | บรอดแคสต์อย่างเดียว | Zane, Chloe, Stella, Marco | `line_oa_broadcast.py` / `social_broadcast.py` |
| Web Scrapers | อ่านอย่างเดียว | เอเจนต์ทุกตัว | โค้ดดึงข้อมูลพื้นฐานในตัว |
