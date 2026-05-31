## SYSTEM_STATE — 2026-06-01 01:30

## Services
| Service | Status | Note |
|---|---|---|
| n8n | UP | localhost:5678 / n8n.peabuntid.com |
| postgres | UP | coprem + coprem_os |
| redis | UP | PONG |
| litellm | UP | localhost:4000 / litellm.peabuntid.com |
| dify | UP | cloud.dify.ai |
| Postgres auth | OK | |

## Active Pillar
JOB only — PERSONAL/CREATIVE suspended until WF01 stable 1 week

## Workflow Status
| Workflow | Active | Note |
|---|---|---|
| WF01 — Inbox Receiver (Single Entry) | ✅ | ID: jFq7aSFJQ7ElHoLZ — plain Webhook /telegram-coprem |
| WF01 — Inbox Receiver (Dify) | ✅ | |
| WF02 — Daily Morning Brief | ✅ | |
| WF03 — Market Pulse Scanner | ✅ | |
| WF04 — Weekly OKR Review | ✅ | |
| WF05 — HITL Decision Saver | ✅ | |
| WF06 — Health Ping | ✅ | |
| WF07 — Feedback Collector | ✅ | |
| WF08 — Self-Optimization Loop | ✅ | |
| WF09 — Automated Backup | ✅ | cron Sun 03:00 |
| WF10 — KB Sync (Auto-Librarian) | ✅ | |
| WF11 — DLQ Processor | ✅ | |
| WF L1-C — Provider Router | ✅ | ID: 4kUNH6gYNQxg3VN1 |
| WF L1.5 — Session Context Manager | ✅ | |
| WF L8 — Daily Monitor Report | ✅ | |

## Layer Status
| Layer | Status |
|---|---|
| L1-B Smart Router | ✅ |
| L1-C Provider Router | ✅ |
| L1.5 Session Manager | ✅ |
| L2 Agents (Dify) | ✅ cloud.dify.ai UP |
| L2.5 Normalizer | ✅ |
| L3 Memory/KB | ✅ pgvector live |
| L4 Content Library | ✅ |
| L5 Feedback Loop | ✅ |
| L6 Cron | ✅ 11/11 |
| L7 Security | ✅ |
| L8 Monitoring | ✅ |

## Stack
```
n8n        → localhost:5678 / n8n.peabuntid.com
Postgres   → coprem (n8n) + coprem_os (app, 21 tables)
Redis      → session cache
LiteLLM    → localhost:4000 / litellm.peabuntid.com (6 Gemini + Groq fallback)
Dify.ai    → cloud.dify.ai (UP)
GitHub CI  → coprem-mac runner
```

## AI Provider Chain
```
Request → LiteLLM → Gemini 2.0 Flash (6 keys rotate)
                  → Groq llama-3.3-70b (fallback เมื่อ Gemini quota หมด)
```

## Key Changes (2026-06-01)
- WF01 Telegram Trigger → plain Webhook node (/webhook/telegram-coprem) — ไม่มี secret issue
- LiteLLM proxy เพิ่ม Groq fallback — ไม่ต้องรอ quota reset แล้ว
- scripts/fix_credentials.py — auto-sync Postgres credential ทุก health_check
- scripts/post_restart.sh — self-healing หลัง n8n restart

## Pending
- WF01 end-to-end test (Telegram → Dify → reply) ยังอยู่ระหว่างทดสอบ
- Dify app ยังต้องเปลี่ยน model เป็น Groq/LiteLLM
