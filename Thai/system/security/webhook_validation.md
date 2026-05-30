# L7 — การตรวจสอบ Webhook Signature

> Blueprint v8.2 | GAP-07 | Layer: L7 Security & Compliance
> ไฟล์นี้เป็น Read-Only Mirror ของ `English/system/security/webhook_validation.md`

Webhook ขาเข้าทุกรายการต้องผ่านการตรวจสอบ Signature ก่อนถึง L0
คำขอที่ไม่ผ่าน → 401, บันทึกใน `audit_log`, ติดตาม IP ใน `blocked_ips`

---

## Discord — Ed25519

**Header:** `X-Signature-Ed25519` + `X-Signature-Timestamp`
**Env var:** `DISCORD_PUBLIC_KEY`

กฎ:
- ตรวจสอบ Ed25519 signature กับ `timestamp + rawBody`
- ปฏิเสธถ้า timestamp เก่ากว่า 300 วินาที (ป้องกัน replay attack)
- ล้มเหลว → 401 + บันทึก audit_log + นับ IP fail counter
- IP ล้มเหลว > 5 ครั้งใน 10 นาที → ใส่ blocked_ips (แบน 24 ชม.)

## LINE — HMAC-SHA256

**Header:** `X-Line-Signature`
**Env var:** `LINE_CHANNEL_SECRET`

กฎ:
- คำนวณ `HMAC-SHA256(LINE_CHANNEL_SECRET, rawBody)` → base64
- เปรียบเทียบกับค่าใน header
- ล้มเหลว → 401 + บันทึก audit_log

## ตำแหน่งใน n8n

การตรวจสอบทำงานเป็น **node แรก** ใน Workflow-01 ก่อน logic ของ L0
Branch ล้มเหลว → ส่งคืน 401 → จบ ไม่มีการ retry
