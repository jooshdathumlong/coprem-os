# พิมพ์เขียว: การย้ายระบบสู่ Model Context Protocol (MCP)

## 1. เป้าหมาย
เปลี่ยนระบบจากการรันสคริปต์แบบ Shell ที่เปราะบาง (`run_command("python sqlite_io.py insert ...")`) ไปสู่มาตรฐานเซิร์ฟเวอร์ Model Context Protocol (MCP) สิ่งนี้จะช่วยให้ LLM เข้าใจและเรียกใช้เครื่องมือได้โดยตรงด้วยความแม่นยำของ JSON Schema 100%

## 2. เซิร์ฟเวอร์ที่ต้องสร้าง

### A. เซิร์ฟเวอร์ฐานข้อมูล (`mcp-sqlite`)
- **เป้าหมายที่ห่อหุ้ม:** `sqlite_io.py`
- **เครื่องมือ MCP ที่เปิดให้ใช้:**
  - `db_query(sql: string)`
  - `db_insert(table: string, data: object)`
  - `db_read(table: string, limit: int)`
- **พฤติกรรม:** ทำให้การเข้าออกข้อมูลทั้งหมดไปยัง Coprem.db (SSOT) เป็นมาตรฐาน บังคับตรวจสอบความถูกต้องของ Schema ก่อนแทรกข้อมูล

### B. เซิร์ฟเวอร์ไฟล์ Obsidian (`mcp-obsidian`)
- **เป้าหมายที่ห่อหุ้ม:** `obsidian_io.py`
- **เครื่องมือ MCP ที่เปิดให้ใช้:**
  - `read_dashboard(path: string)`
  - `write_dashboard(path: string, content: string)`
- **พฤติกรรม:** จำกัดการแก้ไขข้อมูลเฉพาะการอัปเดตแดชบอร์ดแบบอ่านอย่างเดียว เนื่องจากสถานะที่แท้จริงจะถูกเก็บไว้ใน SQLite เท่านั้น

### C. เซิร์ฟเวอร์เชื่อมต่อคลาวด์ (`mcp-cloud`)
- **เป้าหมายที่ห่อหุ้ม:** `google_apps_trigger.py`, `social_broadcast.py`, `line_oa_broadcast.py`
- **เครื่องมือ MCP ที่เปิดให้ใช้:**
  - `google_drive_upload(...)`
  - `social_post(platform: string, content: string)`
  - `line_broadcast(message: string)`
- **พฤติกรรม:** ทำหน้าที่เป็นประตูป้องกันการสั่งการออกสู่โลกภายนอก สามารถตั้งค่าเซิร์ฟเวอร์ MCP ให้บังคับขออนุมัติจากผู้ใช้ (HITL) แบบฟิสิคัลผ่านเทอร์มินัลก่อนประมวลผลคำสั่ง API จริง

## 3. ขั้นตอนการดำเนินการ
1. เริ่มต้นโปรเจกต์ MCP Python SDK สำหรับแต่ละเซิร์ฟเวอร์ (ใช้แพ็กเกจ pip `mcp`)
2. ย้ายตรรกะหลักของสคริปต์เดิมเข้าไปในตัวจัดการเครื่องมือ (Handlers) ของ MCP (`@mcp.tool()`)
3. กำหนด JSON schemas ที่เข้มงวดสำหรับอาร์กิวเมนต์เพื่อป้องกันการคิดไปเอง (Hallucination) ของ LLM
4. อัปเดตไฟล์กำหนดค่า `mcp.json` ของ Coprem IDE เพื่อสั่งรันเซิร์ฟเวอร์เหล่านี้อัตโนมัติผ่าน `stdio` ตอนเปิดระบบ
5. ยกเลิกและลบสคริปต์ Python ดิบออกจากแฟ้ม `system/scripts/`
