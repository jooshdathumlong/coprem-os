# COPREM OS — Decision Log

> Jeff บันทึกทุกการตัดสินใจสำคัญที่นี่ทุกครั้งหลังจบ session
> Format: วันที่ | หัวข้อ | เหตุผล | ผลลัพธ์

---

## 2026-05-30

**Telegram แทน LINE/Discord**
เหตุผล: n8n มี Telegram Trigger node พร้อมใช้, ไม่ต้อง signature verification, setup 5 นาที
ผลลัพธ์: @Coprem_Bot live, webhook ถาวรที่ n8n.peabuntid.com

**Gemini แทน OpenAI (MVP)**
เหตุผล: มี Gemini API key อยู่แล้ว, OpenAI ยังไม่มี key
ผลลัพธ์: ใช้ gemini-2.0-flash, สลับ Claude Sonnet เมื่อมี Anthropic key

**Docker Compose แทน local n8n**
เหตุผล: persistent volumes, ไม่หายเมื่อ restart, production-grade
ผลลัพธ์: n8n + Postgres + Redis + Cloudflared รันใน Docker

**Cloudflare Tunnel + peabuntid.com แทน ngrok**
เหตุผล: ngrok URL เปลี่ยนทุก restart, Cloudflare ฟรีและถาวร, ใช้ domain ที่มีอยู่แล้ว
ผลลัพธ์: n8n.peabuntid.com — URL ถาวรไม่เปลี่ยน

**PARA structure แทน English/Thai split**
เหตุผล: English/Thai สับสนใน Obsidian, PARA เป็นมาตรฐานสากล
ผลลัพธ์: 01-projects/ 02-knowledge/ 03-system/ 04-outputs/

**Mac launchd auto-start**
เหตุผล: Prem ไม่อยากสั่ง start เอง ทุกครั้งที่เปิด Mac
ผลลัพธ์: Docker stack รันอัตโนมัติ 30 วินาทีหลัง login

---

## Template (Jeff ใช้ทุก session)

**[หัวข้อการตัดสินใจ]**
เหตุผล: [ทำไมถึงเลือกแบบนี้]
ผลลัพธ์: [เกิดอะไรขึ้น]
