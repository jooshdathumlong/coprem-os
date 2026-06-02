# COPREM OS — Master Context
> อัปเดต: 2026-06-02 | Version: Blueprint v8.4 | Status: **LIVE ✅** | Month 4 ACTIVE — Phase 4 Agents

---

## 1. สถานะระบบตอนนี้

**WF01 ทำงาน end-to-end สมบูรณ์** — Telegram → Jeff ตอบกลับได้จริง
- Execution ล่าสุด: #28 success, 1636ms (2026-06-02)
- LLM: LiteLLM → groq/llama-3.3-70b-versatile (Gemini rate limited)
- 14 bugs แก้แล้ว (ดู STATUS.md รายละเอียด)
- RS Lifestyle DB: rs_lifestyle schema (9 tables, 42 products, 204 KOL, 143 sales)

---

## 2. Full Stack

```
Telegram Bot (@Coprem_Bot, chat_id: 7731591925)
  ↓ webhook POST https://n8n.peabuntid.com/webhook/telegram-coprem

n8n 2.22.5 (localhost:5678 / n8n.peabuntid.com)
  ↓ WF01 Inbox Receiver (ID: jFq7aSFJQ7ElHoLZ — reimported 2026-06-02)

  L7 Security:
    → Audit WEBHOOK_RECEIVED (Postgres audit_log)
    → Check Blocked User (Postgres blocked_ips)
    → Blocked Gate (IF)

  L1 Processing:
    → L1-A Preprocessor (Code: text, userId, hash, isStart/isApproval/isChat)
    → Dedup Check (Postgres dedup_cache)
    → Route by Type (Switch: registration / approval / chat)
    → Check User Approved (Postgres users)
    → Approved? (IF)

  L1.5 + L1-B + HITL:
    → L1.5 Read Session Context (HTTP → WF L1.5)
    → L1-B Classifier (HTTP → LiteLLM: classify pillar/domain/confidence/hitl_required)
    → L1-B Parse (Code: parse JSON response)
    → HITL Gate (IF: hitl_required=true → Telegram alert + STOP)

  L3 Knowledge Retrieval:
    → L3 Prepare (Code: select KB IDs by pillar)
    → L3 Fetch KB (HTTP → Dify datasets API)
    → L3 Get Segments (HTTP → Dify segments API, top 100)
    → L3 Inject Context (Code: pgvector semantic search (nomic-embed-text) → BM25 fallback → top 3 chunks)
    → L3 Build Body (Code: build L1-C request with context)

  L1-C + L2 + L2.5:
    → Dify Smart Router (HTTP → /webhook/l1c-route)
    → L2.5 Normalize Output (Code: extract dify_reply)
    → L7 Audit AGENT_OUTPUT (Postgres)
    → Send Reply (Telegram)
    → L1.5 Write Session Turn (HTTP → WF L1.5)
    → Log to Inbox (Postgres)

LiteLLM (localhost:4000 / litellm.peabuntid.com)
  routing: usage-based-routing-v2 | cooldown: 60s | rpm_limit: 14/key | health_check_interval: 0
  → groq/llama-3.3-70b (PRIMARY — อยู่ position แรก) ✅
  → gemini-2.0-flash × 6 keys (rpm_limit:14) ✅
  → ollama/llama3.1:8b (Tier 3 local) ✅
  → ollama/qwen2.5:7b (Tier 3 fallback) ✅
  ⚠️ ห้ามเรียก GET /health — ใช้ GET /health/liveliness แทน (ไม่ยิง Gemini)

Ollama (localhost:11434 — Mac)
  → llama3.1:8b (4.9GB) ✅
  → qwen2.5:7b (4.7GB) ✅

L1-C Provider Router (path: /webhook/l1c-route)
  → Check Rate Limits → Select Model (Tier 0-3) → Log to Audit
  → Route to Dify (HTTP → LiteLLM, Jeff system prompt + KB context)
  → Respond (JSON: {assigned_agent, selected_model, dify_reply})

Postgres
  → coprem (n8n internal)
  → coprem_os (15 COPREM tables + pgvector)

Redis (host: redis, no password) → session cache
Cloudflare Tunnel → n8n.peabuntid.com + litellm.peabuntid.com
```

---

## 3. Active Workflow IDs

| Workflow | ID | Status |
|---|---|---|
| WF01 — Inbox Receiver | `jFq7aSFJQ7ElHoLZ` | ✅ (reimported 2026-06-02) |
| WF L1-C — Provider Router | `XUweHQoQ1fm34d01` | ✅ |
| WF L1.5 — Session Manager | `2jU4tdTiP1lhNucK` | ✅ |
| WF02 — Daily Morning Brief | `sou01B1RK3u5HZDV` | ✅ v2: tasks+HITL+OKR+date |
| WF03 — Market Pulse Scanner | `HFKavzP2rQGrHYAS` | ✅ |
| WF04 — Weekly OKR Review | `3cGfyp4wgNEXKkFu` | ✅ |
| WF05 — HITL Decision Saver | `7699qQjwmPmkl5cZ` | ✅ |
| WF06 — Health Ping | `XOwT8imiSTKWDJDf` | ✅ |
| WF07 — Feedback Collector | `uJVllR5FRNkYkwzS` | ✅ |
| WF08 — Self-Optimization Loop | `NktiCpwAjT7wrGkj` | ✅ |
| WF09 — Automated Backup | `TuPhYI81MjPd79ED` | ✅ |
| WF10 — KB Sync (Auto-Librarian) | `FmX5xonGLsfnzrIG` | ✅ daily cron + auto-embed after sync |
| WF11 — DLQ Processor | `6ZnSJ4l9TqtKhJ0H` | ✅ |
| WF12 — Memory TTL Enforcer | `B0Ev2dCDSmFsZiqW` | ✅ daily 03:00 |
| WF-HITL-Resolver | `DQh1dFrcWhwowtpj` | ✅ |
| WF L8 — Daily Monitor Report | `fVDJvPERCO23iM4M` | ✅ |

---

## 4. Blueprint Layer Status (v8.3 — 10 layers COMPLETE)

| Layer | Status | รายละเอียด |
|---|---|---|
| L0 Telegram Inbox | ✅ | @Coprem_Bot webhook live |
| L1-A Preprocessor | ✅ | dedup + lang detect + sig validation |
| L1-B Intent Classifier | ✅ | pillar/domain/confidence/hitl via LiteLLM |
| L1-C Provider Router | ✅ | Tier 0-3 + Shadow Testing 10% |
| L1.5 Session Context | ✅ | Redis TTL 30min + Postgres persist |
| L2 Jeff Agent | ✅ | v2.0 prod + v2.1-shadow (10% traffic) |
| L2 Eilinaire Agent | ✅ | PERSONAL pillar active |
| L2 Marketing Agent | ✅ | domain=marketing → KB-01+KB-04 | propose-first behavior |
| L2 Writing Agent | ✅ | domain=novel/story/chapter → KB-02 | section-by-section drafts |
| L2 Trading Agent | ✅ | domain=trading → KB-03+KB-05 | analyst-only, no execution |
| L2 Skill Agent | ✅ | domain=course/learning/data → KB-06+KB-04 | course recommendations |
| L2 Ollama Tier 3 | ✅ | llama3.1:8b + qwen2.5:7b (num_ctx:4096) |
| L2.5 Output Normalizer | ✅ | lang gate + length enforcer |
| L3 KB Retrieval | ✅ | pgvector semantic search (nomic-embed-text) → BM25 fallback |
| L4 Content Library | ✅ | novels(1) + chapters(1) + characters(12/12) |
| L5 Feedback Loop | ✅ | WF07+WF08 active |
| L6 Cron 12/12 | ✅ | WF02-WF12 + WF L8 all active |
| L7 Security + HITL | ✅ | sig validation + HITL gate + audit log |
| L8 Monitoring | ✅ | Daily report + Feedback Collector |
| L9 Command Center | ✅ | Next.js port 3001 + chat sessions + SSE |

---

## 5. Dify Knowledge Bases (cloud.dify.ai)

| KB | Dataset ID | Segments |
|---|---|---|
| KB-01 Brand Constitution | `6b35bc3e-3e47-45d0-8dd4-c9a93629fdf3` | 5 |
| KB-02 Ego Era Bible | `1fa9ce1d-c03a-40a1-9cac-1a935af9b0a1` | 8 |
| KB-03 Trading Rules | `b26b9e09-c8f5-4510-9303-5a9159548d72` | 10 |
| KB-04 Job Knowledge | `64329612-bb5d-4090-8fce-e49499d26379` | 11 |
| KB-05 Decision Memory | `4da3b0fe-49ea-4c12-9273-92045b8f9678` | 11 |
| KB-06 FutureSkill Courses | `044558e7-3203-40ec-be65-5ec6f812e4b0` | 457 courses ✅ ACTIVE |

Service API Key: ดูใน `.env` (DIFY_KB_API_KEY)

**KB Routing:**
- JOB → KB-04 + KB-01
- PERSONAL → KB-05 + KB-01
- CREATIVE → KB-02 + KB-01
- SKILL / COURSE / LEARNING → KB-06 + KB-04
- TRADING → KB-03 + KB-05

---

## 6. Key Configuration

### docker-compose (สำคัญ)
```yaml
n8n environment:
  - WEBHOOK_URL=https://n8n.peabuntid.com
  - N8N_BLOCK_ENV_ACCESS_IN_NODE=false
  - GENERIC_TIMEZONE=Asia/Bangkok   ← ต้องมีไม่งั้น $now = UTC
  - TZ=Asia/Bangkok
```

### ⚠️ Docker Compose Run Command
```bash
# ต้องใช้ --env-file เพราะ .env อยู่ที่ root ไม่ใช่ 03-system/
docker compose -f 03-system/docker-compose.yml --env-file .env up -d
```

### .env Location
```
/Users/eilinaire/coprem/Coprem/.env  ← project root, gitignored
```

Keys ที่สำคัญ (masked):
- `POSTGRES_PASSWORD` — n8n + coprem_os DB password
- `N8N_ENCRYPTION_KEY` — credential encryption
- `N8N_API_KEY` — JWT token for n8n API
- `TELEGRAM_BOT_TOKEN` — @Coprem_Bot token
- `LITELLM_MASTER_KEY` — LiteLLM API key
- `DIFY_KB_API_KEY` — Dify Knowledge API key
- `GROQ_API_KEY` — Groq fallback
- `EILINAIRE_GOOGLE_API_KEY` + 5 more — Gemini keys

### n8n Postgres Credential IDs
- `226PbeVgki0neEi4` = Postgres COPREM (coprem_os)
- `rdxzBrj9putuOkku` = Postgres coprem_os (alt)

---

## 7. Tiered Degradation (L1-C)

| Tier | Trigger | Model |
|---|---|---|
| 0 | Normal | `gemini-2.0-flash` |
| 1 | Cost >$1/day | `gemini-2.0-flash-lite` |
| 2 | Gemini throttled | `groq/llama-3.3-70b` |
| 3 | All cloud down | `ollama/llama3.1:8b` (local, free) |

---

## 8. Database Tables

### coprem_os (COPREM application DB)
```
users, audit_log, inbox_log, dedup_cache, session_store,
rate_limit_registry, blocked_ips, failed_tasks_db, quarantine_db,
task_board, okr_scoreboard, market_signal_log, kb_sync_log,
prompt_library (jeff v2.0✅ / v2.1-shadow✅ / eilinaire v1.0✅),
decision_memory_log (TTL 90d, auto-archive via WF12),
memory_embeddings (pgvector, vector(768), 116 segments),
chat_sessions, chat_messages,   ← v8.3 Dashboard
novels(1), chapters(1), character_tracker(12/12)  ← L4 Ego Era
task_queue  ← autonomous loop queue (added 2026-06-02)
```

### coprem (n8n internal DB) — schema rs_lifestyle
```
rs_lifestyle.brands(3), products(42), channels(8),
trade_conditions(20), ordering_history(39),
sales_transactions(143), mkt_activities(5),
kol_list(204), promotions(9)
← RS Lifestyle business data imported 2026-06-02
```

---

## 9. Scripts

| Script | หน้าที่ |
|---|---|
| `scripts/health_check.sh` | ตรวจ services + webhook — run start/end session |
| `scripts/fix_credentials.py` | Sync n8n Postgres credentials กับ .env |
| `scripts/post_restart.sh` | หลัง restart: fix creds + WF01 + webhook + Ollama |
| `scripts/sync_docs.sh` | Auto-sync SYSTEM_STATE + INDEX + export workflows |
| `scripts/coprem` | CLI: `coprem sync`, `coprem status` |
| `scripts/autonomous_loop.py` | Autonomous task loop — poll 3s, tier fallback, retry backoff |

---

## 10. Post-Restart Checklist

```bash
# Quick (all-in-one)
bash scripts/post_restart.sh

# Manual steps if needed:
docker compose -f 03-system/docker-compose.yml --env-file .env up -d
python3 scripts/fix_credentials.py
ollama serve &
# Activate WF01 via n8n API (see post_restart.sh)
# Re-register Telegram webhook (see post_restart.sh)
```

---

## 11. n8n Quirks (v2.22.5)

| Issue | Fix |
|---|---|
| PUT ไม่ create published version | ต้องใช้ DELETE + POST |
| `.item.json` fails cross-Postgres-node | ใช้ `.first().json` แทน |
| httpRequest v2 sends GET | Upgrade typeVersion → 4.2 |
| Thai text breaks JSON string interpolation | ใช้ `JSON.stringify($json)` |
| $now returns UTC | ต้อง `GENERIC_TIMEZONE=Asia/Bangkok` |
| Telegram Trigger bug (403 secret) | ใช้ plain Webhook node แทน |

---

## 12. Known Issues

| Issue | Workaround |
|---|---|
| Dify vector search (free tier) | ใช้ pgvector + nomic-embed-text แทน ✅ |
| Dify Cloud GPT-4 trial | ใช้ LiteLLM โดยตรง |
| ~~L1-B confidence < 0.7 path~~ | ✅ Low Confidence Reply wired (HITL Gate → Switch node) |

---

## 13. Session 2026-06-01 — สิ่งที่ทำเสร็จ

| เวลา | งาน | ผล |
|---|---|---|
| 01:30 | WF01 end-to-end fix (11 bugs) | ✅ exec 93 success |
| 02:00 | Remove n8n attribution footer | ✅ |
| 02:00 | Migrations 002-004 applied to live DB | ✅ |
| 02:30 | Wire L1-C into WF01 | ✅ |
| 03:00 | L1-B Classifier + HITL Gate + Jeff system prompt | ✅ |
| 03:30 | Ollama Tier 3 (llama3.1:8b + qwen2.5:7b) | ✅ |
| 04:00 | L3 KB Retrieval (Dify Segments + keyword) | ✅ |
| 10:10 | Month 3 unlocked by Prem | ✅ No-Spec + 1-Pillar removed |
| 10:30 | FutureSkill KB taxonomy (14 categories, LinkedIn/Coursera/ESCO) | ✅ CATEGORY_RULES.md v2.0 |
| 10:30 | FutureSkill integration plan (4 phases) | ✅ PLAN_FutureSkill_KB.md |
| 16:30 | FutureSkill 584 courses → 14 .md files in kb/ | ✅ 457 placed, 127 unsorted |
| 16:45 | Postgres import futureskill_courses | ✅ 584 rows, has_pdf mapped |
| 16:45 | KB-06_FutureSkill_Courses.md generated | ✅ 88 KB |
| 16:50 | Dify KB-06 created + uploaded | ✅ dataset_id=044558e7, indexing |
| 17:10 | LiteLLM root cause found | Jeff เรียก /health 3×12 keys = 36 req → ชน RPM — Gemini ไม่เคยถูกใช้จริง |
| 17:10 | LiteLLM config fix | health_check_interval:0 + rpm_limit:14/key + Groq primary + cooldown:60s |
| 17:10 | CLAUDE.md updated | Auto-Update Rule + Token Diet Rules enforced |
| 17:20 | Memory: feedback_litellm_health | ห้ามเรียก /health — ใช้ /health/liveliness เท่านั้น |

**Month 3 — COMPLETE ✅**
**Month 4 — COMPLETE ✅** (Memory TTL + Shadow Testing + KB auto-sync + L4)
**Phase 4 Agents — COMPLETE ✅** (Marketing + Writing + Trading + Skill agents live in L1-C)

## Session Log (2026-06-02)

| งาน | ผล |
|---|---|
| Chat sessions sidebar (ChatGPT-style) | ✅ |
| Blueprint v8.3 (L9, Module 4, DB schema) | ✅ |
| SSE live status — server push 10s | ✅ |
| Chaos experiment (n8n kill/recovery <10s) | ✅ |
| PERSONAL pillar + Eilinaire agent live | ✅ |
| WF06+WF08 activated (12/12 workflows) | ✅ |
| Ollama llama3.1:8b + qwen2.5:7b (tuned) | ✅ |
| WF12 Memory TTL Enforcer (daily 03:00) | ✅ |
| Prompt Library: jeff v2.0/v2.1-shadow/eilinaire v1.0 | ✅ |
| Shadow Testing 10% JOB traffic | ✅ |
| WF10 KB auto-sync: KB_MAP + daily cron | ✅ |
| L4 Ego Era: 12 characters + Ch.1 seeded | ✅ |
| WF13 Discord Monitor | ⛔ deactivated + renamed [INACTIVE] |

## Session Log (2026-06-02 — Session 12+)

| งาน | ผล |
|---|---|
| RS Lifestyle DB import (rs_lifestyle schema) | ✅ 9 tables, 42 products, 143 sales, 204 KOL |
| n8n reimport all workflows (fresh instance) | ✅ 15 active (3 credentials created) |
| embed_kb.py: fix column embedding_768→embedding + dim 3072→768 | ✅ 116 segments |
| WF01: 14 bugs fixed end-to-end | ✅ Execution #28 success |
| LLM: Dify Cloud (GPT-4 blocked) → LiteLLM Groq | ✅ Jeff ตอบกลับแล้ว |
| WF-HITL-Resolver webhook path conflict | ✅ telegram-hitl |
| Redis credential added (WF L1.5) | ✅ ZwmyWJ4IRcXbVY8H |
| SYSTEM_STATE.md overwritten with fresh n8n IDs | ✅ |
