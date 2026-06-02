## SYSTEM_STATE — 2026-06-02 19:36
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

## n8n Credentials (created 2026-06-02)
| ID | Type | Name |
|---|---|---|
| 3zthmqZdGdRYWYG3 | postgres | Postgres coprem_os |
| HwDrAYiJObb07mt1 | telegramApi | Telegram Bot |
| ZwmyWJ4IRcXbVY8H | redis | Redis COPREM |
| eOjevL4EC671XsJZ | postgres | Postgres coprem (rs_lifestyle) |

## n8n Workflows (15 active)
WF01 jFq7aSFJQ7ElHoLZ ✅ | WF L1-C ✅ | WF L1.5 ✅ | WF L8 ✅
WF-HITL-Resolver ✅ (path: telegram-hitl) | WF02-WF11 ✅

## WF01 Architecture (CONFIRMED WORKING 2026-06-02)
- Trigger: webhook /webhook/telegram-coprem
- L7 Security → L1-A (reads $('Telegram Trigger').first().json) → Dedup → Route by Type (fallback='extra')
- Check User Approved (chat_id) → RS Lifestyle DB Context (coprem DB, rs_lifestyle schema)
- Merge Context (Code: full_message) → Build LLM Request (Code: JSON.stringify)
- Dify Smart Router (HTTP → LiteLLM http://litellm:4000 → groq/llama-3.3-70b-versatile)
- L2.5 Normalize Output → L7 Audit → Send Reply ($('L2.5').first().json.reply_text)
- Approved user: chat_id=7731591925 status=approved

## WF01 Status
FULLY OPERATIONAL ✅ | Execution 70 SUCCESS 1847ms
Jeff ตอบ "ยอดขาย Mini Event 52,200 บาท..." จาก DB จริง ✅

## RS Lifestyle Database (coprem DB — schema rs_lifestyle)
brands(3) products(42) channels(8) trade_conditions(20) ordering_history(39)
sales_transactions(143) mkt_activities(5) kol_list(204) promotions(9)

## KB Embeddings
116 segments in memory_embeddings (coprem_os DB) | vector(768) | nomic-embed-text

## Tiered Degradation (actual)
- Tier 0: groq/llama-3.3-70b-versatile (Gemini rate limited)
- Tier 1: gemini-2.0-flash-lite
- Tier 2: gemini-2.0-flash
- Tier 3: ollama/llama3.1:8b

## Autonomous Loop
scripts/autonomous_loop.py | Poll: 3s | Auto-start: launchd plist

## Known Issues / Next Session
- health_check.sh: auto-fix Telegram webhook URL drift ✅ (แก้แล้ว)
- Gemini API rate limited → Groq fallback active
- WF01 RS Lifestyle DB query: only queries Mini Event sales — ยังไม่ handle query types อื่น
- WF L1.5 Session Context Manager: error ทุก execution (Redis credential issue ยังมีอยู่)
