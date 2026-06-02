## SYSTEM_STATE — 2026-06-02 07:37
| n8n | UP |  |
| postgres | UP |  |
| redis | UP | PONG |
| litellm | UP | port 4000 |
| dify | UP |  |
| Postgres auth | OK |
| WEBHOOK_URL | OK | https://n8n.peabuntid.com |
| Telegram webhook | OK |
| Dashboard | UP | port 3001 |
| Ollama | UP | llama3.1:8b (4.9GB) + qwen2.5:7b (4.7GB) | num_ctx:4096 |
| nomic-embed-text | PULLED | 116 segments embedded |
| Autonomous Loop | UP | PID file: logs/autonomous_loop.pid | poll 3s |

## Active Pillar
JOB + PERSONAL (1-Pillar Rule unlocked 2026-06-01 | CREATIVE suspended)

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
Port 3001 | 8 tabs: Chat / HITL / KB / Browser / Guide / System / Sessions / Tasks
Tasks tab: 5s auto-refresh | New Task form | status badges | stats row
Cost API: /api/cost → LiteLLM /global/spend ($0.0497 today)

## Autonomous Loop
scripts/autonomous_loop.py | Poll: 3s | Handlers: chat/analysis/agent_handoff/report/kb_embed
Tier fallback: flash→lite→groq→ollama | Retry backoff: 15s→60s→300s | 2s throttle between LLM tasks
Auto-start: scripts/start_coprem.sh | Auto-stop: scripts/stop_coprem.sh

## All Phases
Phase 1 T1-T5 ✅ | Phase 2 S1-S7 ✅ | Phase 3 Dashboard ✅ | Phase 4 Agents ✅ | Month 3 ✅ | Month 4 ✅ | Autonomous Loop ✅
