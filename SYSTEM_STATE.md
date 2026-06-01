## SYSTEM_STATE — 2026-06-01 17:55
| n8n | UP |  |
| postgres | UP |  |
| redis | UP | PONG |
| litellm | UP | port 4000 |
| dify | UP |  |
| Postgres auth | OK |
| WEBHOOK_URL | OK | https://n8n.peabuntid.com |
| Telegram webhook | OK |

## Active Pillar
JOB (PERSONAL/CREATIVE suspended per rules)

## WF01 Status
Active | 39 nodes | Semantic retrieval + BM25 fallback | HITL queue wired | Injection defense ON

## Pending
- LiteLLM container restart (T1: usage-based-routing-v2 config written, not active yet)
- Run scripts/embed_kb.py (S1: semantic embeddings need initial population)
- Start dashboard: cd dashboard && npm run dev (port 3001)
