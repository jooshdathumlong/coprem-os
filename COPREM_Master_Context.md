# COPREM OS — Master Context
> อัปเดต: 2026-06-01 11:00 | Version: Blueprint v8.2 Complete | Status: **LIVE ✅** | Month 3 ACTIVE

---

## 1. สถานะระบบตอนนี้

**WF01 ทำงาน end-to-end สมบูรณ์** — Telegram → Jeff ตอบกลับได้จริง
- Execution ล่าสุด: success, 24 nodes, 0 errors
- Jeff ตอบได้ทั้ง Thai/English พร้อม KB context จาก Dify

---

## 2. Full Stack

```
Telegram Bot (@Coprem_Bot, chat_id: 7731591925)
  ↓ webhook POST https://n8n.peabuntid.com/webhook/telegram-coprem

n8n 2.22.5 (localhost:5678 / n8n.peabuntid.com)
  ↓ WF01 Inbox Receiver (ID: 4uVEG8SEM23BDrdu, 24 nodes)

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
    → L3 Inject Context (Code: BM25 keyword match → top 3 chunks)
    → L3 Build Body (Code: build L1-C request with context)

  L1-C + L2 + L2.5:
    → Dify Smart Router (HTTP → /webhook/l1c-route)
    → L2.5 Normalize Output (Code: extract dify_reply)
    → L7 Audit AGENT_OUTPUT (Postgres)
    → Send Reply (Telegram)
    → L1.5 Write Session Turn (HTTP → WF L1.5)
    → Log to Inbox (Postgres)

LiteLLM (localhost:4000 / litellm.peabuntid.com)
  → gemini-2.0-flash × 6 keys (round-robin per minute)
  → groq/llama-3.3-70b (fallback)
  → ollama/llama3.1 (Tier 3 local)
  → ollama/qwen2.5 (Tier 3 fallback)

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

| Workflow | ID |
|---|---|
| WF01 — Inbox Receiver | `4uVEG8SEM23BDrdu` |
| WF L1-C — Provider Router | path: `/webhook/l1c-route` |
| WF L1.5 — Session Manager | `2jU4tdTiP1lhNucK` |
| WF02–WF11, L8 | ตาม STATUS.md |

---

## 4. Blueprint Layer Status (100% complete)

| Layer | Status |
|---|---|
| L0 Telegram Inbox | ✅ |
| L1-A Preprocessor | ✅ |
| L1-B Intent Classifier (LLM) | ✅ |
| L1-C Provider Router (Tier 0-3) | ✅ |
| L1.5 Session Context (Redis+Postgres) | ✅ |
| L2 Jeff Agent (LiteLLM + system prompt) | ✅ |
| L2 Ollama Tier 3 (llama3.1 + qwen2.5) | ✅ |
| L2.5 Output Normalizer | ✅ |
| L3 KB Retrieval (Dify Segments + BM25) | ✅ |
| L4 Content Library | ✅ |
| L5 Feedback Loop | ✅ |
| L6 Cron 11/11 | ✅ |
| L7 Security + HITL Gate | ✅ |
| L8 Monitoring | ✅ |

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
- JOB → KB-04 + KB-05
- PERSONAL → KB-01 + KB-05
- CREATIVE → KB-02 + KB-05

**Note:** Vector search ไม่ทำงาน (Dify free tier ไม่มี embedding) → ใช้ keyword matching แทน

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
/Users/eilinaire/Desktop/Coprem/.env  ← root, gitignored
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
| 1 | Cost >$1/day | `gemini-2.0-flash` |
| 2 | Gemini throttled | `gemini-2.0-flash-lite` |
| 3 | All cloud throttled | `ollama/llama3.1` (local, free) |

---

## 8. Database Tables (coprem_os)

```
users, audit_log, inbox_log, dedup_cache, session_store,
rate_limit_registry, blocked_ips, failed_tasks_db, quarantine_db,
task_board, okr_scoreboard, market_signal_log, kb_sync_log,
prompt_library, decision_memory_log, memory_embeddings (pgvector)
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
| Dify KB vector search ไม่ทำงาน | Segments API + BM25 keyword match (live) |
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

**Month 3 Backlog (ACTIVE):**
- Next.js Dashboard (P1), WebSocket (P2), Ollama tuning (P2), Chaos experiment (P3)
- FutureSkill KB-06: ✅ DONE — Postgres 584 rows + KB-06.md (88KB) + Dify indexed | 127 unsorted = ระยะยาว
| 04:30 | Timezone fix (GENERIC_TIMEZONE=Asia/Bangkok) | ✅ |
