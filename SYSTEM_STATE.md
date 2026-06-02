## SYSTEM_STATE — 2026-06-02 19:31
| n8n | UP |  |
| postgres | UP |  |
| redis | UP | PONG |
| litellm | UP | port 4000 |
| dify | UP |  |
| Postgres auth | OK |
| WEBHOOK_URL | OK | https://n8n.peabuntid.com |
| Telegram webhook | OK | https://n8n.peabuntid.com/webhook/telegram-coprem |
| Autonomous Loop | UP | PID file: logs/autonomous_loop.pid | poll 3s |
| Dashboard | UP | port 3001 |
| Ollama | UP | nomic-embed-text pulled |

## Active Pillar
JOB + PERSONAL (1-Pillar Rule unlocked 2026-06-01 | CREATIVE suspended)

## n8n Credentials (fresh instance — created 2026-06-02)
| ID | Type | Name |
|---|---|---|
| 3zthmqZdGdRYWYG3 | postgres | Postgres coprem_os |
| HwDrAYiJObb07mt1 | telegramApi | Telegram Bot |
| ZwmyWJ4IRcXbVY8H | redis | Redis COPREM |

## n8n Workflows (15 active / 3 inactive duplicates)
WF01 Single Entry ✅ | WF L1-C ✅ | WF L1.5 ✅ | WF L8 ✅
WF-HITL-Resolver ✅ | WF02-WF11 ✅ (excl WF13 deferred)
WF01 Dify ❌ (inactive, unused) | WF10/WF11 duplicates ❌

## WF01 Architecture (as of 2026-06-02 — CONFIRMED WORKING)
- Trigger: webhook /webhook/telegram-coprem
- L7 Security → L1-A Preprocessor → Dedup → Route by Type
- RS Lifestyle DB Context → Merge Context → Build LLM Request → LiteLLM → Reply
- LLM: LiteLLM http://litellm:4000 → model: groq/llama-3.3-70b-versatile
- DB query: rs_lifestyle.sales_transactions (coprem DB, cred eOjevL4EC671XsJZ)
- Approved user: chat_id=7731591925 (Prem) status=approved
- CONFIRMED: Jeff replies "ยอดขาย Mini Event 52,200 บาท..." from real DB data ✅

## Tiered Degradation (actual)
- Tier 0: groq/llama-3.3-70b-versatile (Gemini rate limited)
- Tier 1: gemini-2.0-flash-lite
- Tier 2: gemini-2.0-flash
- Tier 3: ollama/llama3.1:8b

## WF01 Status
FULLY OPERATIONAL ✅ | Execution 70 SUCCESS 1847ms (DB context working)
Jeff answers from rs_lifestyle DB | "ยอดขาย Mini Event 52,200 บาท..." confirmed ✅
n8n credential: eOjevL4EC671XsJZ (Postgres coprem — rs_lifestyle schema)

## RS Lifestyle Database
Schema: rs_lifestyle (PostgreSQL — coprem DB)
brands(3) products(42) channels(8) trade_conditions(20) ordering_history(39)
sales_transactions(143) mkt_activities(5) kol_list(204) promotions(9)

## KB Embeddings
116 segments in memory_embeddings (coprem_os DB) | vector(768) | nomic-embed-text
Last embed: 2026-06-02

## Workflows (14 active / 1 inactive)
WF01-WF12 ✅ | WF-HITL-Resolver ✅ | WF L1-C ✅ | WF L1.5 ✅ | WF L8 ✅
WF13 [INACTIVE] Discord — deferred

## Dashboard
Port 3001 | 8 tabs: Chat / HITL / KB / Browser / Guide / System / Sessions / Tasks

## Autonomous Loop
scripts/autonomous_loop.py | Poll: 3s | Handlers: chat/analysis/agent_handoff/report/kb_embed
Auto-start: launchd plist (fixed 2026-06-02) | PID guard active

## All Phases
Phase 1 T1-T5 ✅ | Phase 2 S1-S7 ✅ | Phase 3 Dashboard ✅ | Phase 4 Agents ✅ | Month 3 ✅ | Month 4 ✅ | Autonomous Loop ✅
