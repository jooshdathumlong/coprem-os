# COPREM OS — Reference
> 2026-06-01 | Phase 1+2+3 complete

## Stack

| Service | URL |
|---|---|
| n8n | localhost:5678 |
| LiteLLM | localhost:4000 |
| Dashboard | localhost:3000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |
| Ollama | localhost:11434 |
| Dify KB | cloud.dify.ai |
| Telegram | @Coprem_Bot |

## Model Tiers

0 → gemini-2.0-flash | 1 → gemini-lite | 2 → groq/llama-3.3-70b | 3 → ollama (local)

## KB Routing

SKILL/COURSE → KB-06 | JOB → KB-04+05 | PERSONAL → KB-01+05 | CREATIVE → KB-02+05

## After Restart

```bash
bash scripts/post_restart.sh
```

## Scripts

```bash
bash scripts/health_check.sh    # ตรวจระบบ
bash scripts/latency_report.sh  # ดู latency
python3 scripts/embed_kb.py     # embed KB ใหม่
```

## n8n Quirks

- `.item.json` → ใช้ `.first().json`
- GET /health → ใช้ GET /health/liveliness
- Telegram Trigger bug → ใช้ plain Webhook node

## HITL

confidence < 0.7 → Jeff หยุด + แจ้ง Telegram → `/resolve <id> <คำตอบ>`
