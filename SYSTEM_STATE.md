## SYSTEM_STATE — 2026-06-02 19:52
| n8n | UP |  |
| postgres | UP |  |
| redis | UP | PONG |
| litellm | UP | port 4000 |
| dify | UP |  |
| Postgres auth | OK |
| WEBHOOK_URL | OK | https://n8n.peabuntid.com |
| Telegram webhook | OK | https://n8n.peabuntid.com/webhook/telegram-coprem |
| Autonomous Loop | UP | PID 3237 (logs/autonomous_loop.pid) |
| Autonomous Loop | UP | PID file: logs/autonomous_loop.pid |
| Dashboard | UP | port 3001 |
| Ollama | UP | nomic-embed-text |

## Active Pillar
JOB + PERSONAL (1-Pillar Rule unlocked 2026-06-01 | CREATIVE suspended)

## n8n Credentials
| ID | Type | Name |
|---|---|---|
| 3zthmqZdGdRYWYG3 | postgres | Postgres coprem_os |
| HwDrAYiJObb07mt1 | telegramApi | Telegram Bot |
| ZwmyWJ4IRcXbVY8H | redis | Redis COPREM |
| eOjevL4EC671XsJZ | postgres | Postgres coprem (rs_lifestyle) |

## n8n Workflows (15 active)
WF01 jFq7aSFJQ7ElHoLZ ✅ | WF L1-C ✅ | WF L1.5 ✅ (Redis fixed) | WF L8 ✅
WF-HITL-Resolver ✅ (path: telegram-hitl) | WF02-WF11 ✅

## WF01 Architecture (CONFIRMED WORKING)
- Trigger: /webhook/telegram-coprem (auto-fix via health_check.sh)
- L7 → L1-A → Dedup → Route (fallback=extra) → Check User Approved
- RS Lifestyle DB Context (coprem DB — COALESCE, 5 context types)
- Merge Context → Build LLM Request → LiteLLM → groq/llama-3.3-70b-versatile
- L2.5 → Send Reply ($('L2.5 Normalize Output').first().json.reply_text)

## Jeff Query Coverage
| Query type | Keyword | Context |
|---|---|---|
| ยอดขาย/sales | ยอดขาย/sale/mini event | Mini Event 52,200 THB + breakdown |
| ราคา/price | ราคา/price/wholesale/retail | W=95/R=160 THB (Scrub Daddy) |
| KOL | kol/influencer/tiktok | 204 คน, avg 4,507 THB, รวม 405,600 THB |
| trade | trade/gp/central/เงื่อนไข | GP=25%, MKT=3%, Rebate=1%, DC=3.7% |
| brand/general | ทุกอย่างอื่น | Royal Shammi brand overview |

## RS Lifestyle Database (coprem DB — schema rs_lifestyle)
brands(3) products(42) channels(8) trade_conditions(20) ordering_history(39)
sales_transactions(143) mkt_activities(5) kol_list(204, 90 with cost_thb) promotions(9)

## KB Embeddings
116 segments in memory_embeddings (coprem_os) | vector(768)

## LLM Tier
Tier 0: groq/llama-3.3-70b-versatile (Gemini all rate-limited, reset ตีสาม Thai time)

## Known Issues / Next Session
- Gemini keys: all 429 → Groq fallback active
- KOL cost_thb: 90/204 rows have data (114 rows ยังว่าง — ต้อง import ชีต Lot 1-3)
- WF01 DB query: ยังไม่รองรับ Batiste sales / promotion calendar
