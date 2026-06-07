# COPREM Security Guide

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Credential Management

### Cascade Rule (2026-05-31)
ก่อนเปลี่ยน credential ใดๆ:
1. `bash infra/scripts/credential_map.sh` — ดู dependencies ทั้งหมด
2. เปลี่ยนใน 1 script atomically
3. ห้ามเปลี่ยนทีละ layer

### Secret Guard
- Mask credentials เสมอ: `abc***xyz`
- ห้าม print raw credentials ใน logs หรือ responses
- `.env` ไม่เคย commit เข้า git

## Key Credentials (masked)

| Service | Variable | ใช้ที่ไหน |
|---|---|---|
| Telegram Bot | TELEGRAM_BOT_TOKEN | WF01, n8n webhooks |
| n8n API | N8N_API_KEY | script automation |
| LiteLLM | LITELLM_MASTER_KEY | Rex cost monitoring |
| Postgres | POSTGRES_PASSWORD | DB access |
| Dify | DIFY_API_KEY | KB, agent apps |

## PDPA Compliance (Lex oversees)

**ข้อมูลที่เก็บใน COPREM:**
- chat_id, first_name, username (Telegram users)
- Message logs (inbox_log)
- Approval history

**Rules:**
- ข้อมูล user ลบได้ตาม request
- ไม่ส่งข้อมูล user ให้ third party โดยไม่ได้รับอนุญาต
- Log retention: 90 วัน (หลังจากนั้น archive หรือลบ)

## Security Checklist (Krit รันก่อน deploy)

- [ ] No hardcoded credentials in code
- [ ] No SQL injection vectors (parameterized queries)
- [ ] No XSS in dashboard (sanitize user input)
- [ ] Docker containers ไม่ expose port ที่ไม่จำเป็น
- [ ] `.env` อยู่ใน `.gitignore`
