## SYSTEM_STATE — 2026-06-02 03:32
| n8n | UP |  |
| postgres | UP |  |
| redis | UP | PONG |
| litellm | UP | port 4000 | usage-based-routing-v2 ACTIVE |
| dify | UP |  |
| Postgres auth | OK |
| WEBHOOK_URL | OK | https://n8n.peabuntid.com |
| Telegram webhook | OK |
| Dashboard | UP | port 3001 |
| Ollama | UP | llama3.1:8b (4.9GB) + qwen2.5:7b (4.7GB) | num_ctx:4096 |
| nomic-embed-text | PULLED | 116 segments embedded |

## Active Pillar
JOB + PERSONAL (1-Pillar Rule unlocked 2026-06-01 | CREATIVE suspended)
- JOB → Jeff agent | KB-04 + KB-01
- PERSONAL → Eilinaire agent | KB-05 + KB-01
- SKILL/COURSE/LEARNING → KB-06 + KB-04
- TRADING → KB-03 + KB-05

## Tiered Degradation (actual)
- Tier 0: gemini-2.0-flash
- Tier 1: gemini-2.0-flash-lite (cost >$1/day)
- Tier 2: groq/llama-3.3-70b (Gemini throttled)
- Tier 3: ollama/llama3.1:8b (all cloud down)

## WF01 Status
Active | 39 nodes | pgvector semantic search (nomic-embed-text) → BM25 fallback | HITL queue | Injection defense | 3 agent modes

## Workflows (14 active / 1 inactive)
WF01-WF12 ✅ | WF-HITL-Resolver ✅ | WF L1-C ✅ | WF L1.5 ✅ | WF L8 ✅
WF13 [INACTIVE] Discord — deferred

## Dashboard
Port 3001 | 7 tabs: Chat (session sidebar) / HITL / KB / Browser / Guide / System / Sessions
Chat sessions: PostgreSQL-backed | SSE live status: /api/status-stream (10s push)
Launch: double-click "COPREM OS.app" on Desktop

## All Phases
Phase 1 T1-T5 ✅ | Phase 2 S1-S7 ✅ | Phase 3 Dashboard ✅ | Phase 4 Agents ✅ | Month 3 ✅ | Month 4 ✅
