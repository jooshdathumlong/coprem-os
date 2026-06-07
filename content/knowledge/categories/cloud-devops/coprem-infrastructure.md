# COPREM Infrastructure Reference

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Stack Overview

| Service | Image | Port | หน้าที่ |
|---|---|---|---|
| n8n | n8nio/n8n:latest | 5678 | Workflow orchestration |
| postgres | pgvector/pgvector:pg16 | 5432 | Primary DB + vector store |
| redis | redis:alpine | 6379 | Cache/queue |
| litellm | ghcr.io/berriai/litellm | 4000 | LLM API gateway |
| dify | langgenius/dify | — | Agent UI |
| dashboard | Next.js custom | 3001 | COPREM UI |

## Key Commands

```bash
# Health check (รันทุก session)
bash infra/scripts/health_check.sh

# Post-restart (หลัง docker restart)
bash infra/scripts/post_restart.sh

# View logs
docker logs --tail 30 03-system-n8n-1
docker logs --tail 30 03-system-postgres-1

# Postgres query
docker exec 03-system-postgres-1 psql -U coprem -d coprem_os -c "SELECT ..."

# Embed KB
python3 infra/scripts/embed_kb.py

# Scout pgvector pipeline
python3 infra/scripts/scout_embed.py
```

## Databases

| DB | ใช้ทำอะไร |
|---|---|
| coprem | n8n internal tables |
| coprem_os | COPREM application (users, inbox_log, KB, agent data) |
| litellm | LiteLLM spend tracking |

## Key Tables (coprem_os)

| Table | Agent | หน้าที่ |
|---|---|---|
| inbox_log | Jeff | Message history |
| memory_embeddings | All | pgvector KB |
| research_feeds | Scout | Research findings + embeddings |
| finance_daily_costs | Rex | API cost tracking |
| agent_workload_log | Vera | Agent activity |
| qa_audit_log | Quinn | QA reviews |
| content_drafts | Jeff | Caption/description drafts |
| campaign_plans | Nova | Campaign plans |

## n8n Workflows (Active)

| ID | Name | Schedule |
|---|---|---|
| WF01 | Inbox Receiver | On Telegram message |
| WF_SCOUT lArwKZDTKvkj5M7k | Daily Research | 07:00 daily |
| WF_REX ZQBr6O5TU0rVUnVz | Cost Report | 23:00 daily |
| WF_VERA jffezDI5uhrU16L5 | Agent Performance | Mon 08:00 |
| WF_ANALYST B7IGcTj5x0EipJz8 | Self-Audit | Sun 22:00 |

## Webhook

Telegram → `https://n8n.peabuntid.com/webhook/telegram-coprem`
Force reset: `bash infra/scripts/health_check.sh`
