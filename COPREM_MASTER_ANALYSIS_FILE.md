# COPREM OS — Master Analysis File
> สร้าง: 2026-06-07 | Version: 8.5 | Purpose: AI Analysis & Development Reference
> ไฟล์นี้รวมทุกอย่างในที่เดียว — context, architecture, state, bugs, roadmap

---

## SECTION 1 — WHO IS PREM (Owner / Commander)

**Name:** Prem | **Role:** Marketing Manager, Royal Shammi Co., Ltd.
**Assistant:** Jeff (INTJ Executive Partner) — "I manage, command, and make Prem rich."

### Goals
- ลด mental load — delegate งาน repetitive ให้ AI
- เพิ่ม income streams หลายทางพร้อมกัน
- Centralize context — ไม่ต้อง re-explain เดิมทุก session
- Automate marketing, content, OKR tracking ผ่าน Telegram

### Active Projects
| Project | Pillar | Status |
|---------|--------|--------|
| Digital Marketing (Royal Shammi) | JOB | Active — Batiste + Scrub Daddy |
| Eilinaire Brand | PERSONAL | Phase 1 FOCUS (drink+shirt) |
| Peabuntid Brand | PERSONAL | Trusted Curator Platform (TH) |
| EGO ERA Novel | CREATIVE | SUSPENDED |
| Trading (The5ers + Mutual Funds) | PERSONAL | Research phase |
| Music | PERSONAL | Sandbox |

### Business Context — Royal Shammi
- **แบรนด์:** Batiste Dry Shampoo (หลัก) + Scrub Daddy (รอง)
- **Batiste Target:** สาวออฟฟิศ 24–32 / นักศึกษา 18–23 | Pain: ไม่มีเวลาสระผม
- **Scrub Daddy Target:** แม่บ้าน + Gen Z | Viral product จาก Shark Tank
- **ช่องทาง:** TikTok, Lazada/Shopee, Watsons, Central, ร้านสะดวกซื้อ
- **KOL Budget:** 141 คน, 61 มีต้นทุน, รวม 275,000 THB, avg 4,508/คน
- **Sales:** Mini Event 52,200 THB (143 transactions)

---

## SECTION 2 — SYSTEM OVERVIEW

### What is COPREM OS?
Personal AI Executive Partner System — รับ input ผ่าน Telegram → route → process → ตอบกลับ
Built on: n8n (workflow) + LiteLLM (model routing) + Postgres/pgvector (memory) + Next.js (dashboard)

### 10-Layer Architecture
```
L0   Universal Inbox          Telegram bot (@Coprem_Bot)
L1   Routing Engine           L1-A Preprocessor → L1-B Classifier → L1-C Provider Router
L1.5 Session Context Manager  Redis multi-turn state per user
L2   Hybrid Agent Roster      Jeff (JOB) / Eilinaire (PERSONAL) / Ollama (local fallback)
L2.5 Output Normalizer        Language gate + Length enforcer + Format validator
L3   Hybrid Memory & Retrieval pgvector semantic search (nomic-embed-text 768d)
L4   Content Library          Novels, Characters, Lore (Ego Era — SUSPENDED)
L5   Cybernetic Feedback Loop  WF07 score → WF08 self-optimization
L6   Auto-Mode Cron           WF02–WF12: Brief, Market, OKR, Health, DLQ
L7   Security & Compliance    Audit log, HITL gate, blocked users, dedup
L8   Monitoring               Daily KPI + SLO + Cost report
L9   Command Center           Next.js port 3001 — chat, KB, HITL, status
```

---

## SECTION 3 — INFRASTRUCTURE (Live State as of 2026-06-07)

### Services
| Service | Status | URL/Port |
|---------|--------|----------|
| n8n 2.22.5 | UP | localhost:5678 / n8n.peabuntid.com |
| Postgres (pgvector:pg16) | UP | localhost:5432 |
| Redis 7 | UP | localhost:6379 |
| LiteLLM | UP | localhost:4000 / litellm.peabuntid.com |
| Dify (cloud) | UP | cloud.dify.ai |
| Ollama | UP | localhost:11434 |
| Next.js Dashboard | UP | localhost:3001 |
| Cloudflare Tunnel | UP | n8n.peabuntid.com + litellm.peabuntid.com |
| Autonomous Loop | UP | PID tracked in system/logs/ |

### Docker Compose
```bash
# Run command (--env-file required — .env at project root)
docker compose -f infra/docker-compose.yml --env-file .env up -d
```

### Telegram
- Bot: @Coprem_Bot | chat_id (Prem): 7731591925
- Webhook: https://n8n.peabuntid.com/webhook/telegram-coprem
- Force-reset on every health_check.sh run (prevents n8n test mode override)

---

## SECTION 4 — MODEL ROUTING (LiteLLM + Tiered Degradation)

```
Normal          groq/llama-3.3-70b-versatile (PRIMARY via usage-based-routing-v2)
Fallback T1     gemini-2.0-flash × 6 keys (rpm_limit:14/key, cooldown:60s)
Fallback T2     gemini-2.0-flash-lite
Fallback T3     ollama/llama3.1:8b (local, free, num_ctx:4096)
Fallback T4     ollama/qwen2.5:7b
Killswitch      Manual only — queue to failed_tasks_db
```

**Cost Thresholds:**
| Trigger | Action |
|---------|--------|
| >$1/day | Thinking tasks → Gemini Pro |
| >$3/day | All tasks → Gemini Flash |
| >$5/day | Ollama only |
| Manual | Killswitch |

**L1-B Classifier:** ollama/qwen2.5:3b (local — no rate limits)
**⚠️ Never call GET /health** → ยิง all 6 Gemini keys → RPM limit ทันที. ใช้ GET /health/liveliness

---

## SECTION 5 — ACTIVE WORKFLOWS

| Workflow | ID | Status | Function |
|----------|-----|--------|----------|
| WF01 Inbox Receiver | v4I9Kej9VjM2bdEm | ✅ ACTIVE | Main Telegram entry point |
| WF L1-C Provider Router | XUweHQoQ1fm34d01 | ✅ | Model routing |
| WF L1.5 Session Manager | 2jU4tdTiP1lhNucK | ✅ | Redis multi-turn context |
| WF02 Daily Morning Brief | sou01B1RK3u5HZDV | ✅ | 08:00 BKK daily |
| WF03 Market Pulse Scanner | HFKavzP2rQGrHYAS | ✅ | Every 6h |
| WF04 Weekly OKR Review | 3cGfyp4wgNEXKkFu | ✅ | Sunday 20:00 |
| WF05 HITL Decision Saver | 7699qQjwmPmkl5cZ | ✅ | Approve/reject webhook |
| WF06 Health Ping | XOwT8imiSTKWDJDf | ✅ | Every 6h |
| WF07 Feedback Collector | uJVllR5FRNkYkwzS | ✅ | Boss rates ⭐1–5 |
| WF08 Self-Optimization | NktiCpwAjT7wrGkj | ✅ | Sunday 22:00 |
| WF09 Automated Backup | TuPhYI81MjPd79ED | ✅ | Sunday 03:00 |
| WF10 KB Sync | FmX5xonGLsfnzrIG | ✅ | Daily + GDrive webhook |
| WF11 DLQ Processor | 6ZnSJ4l9TqtKhJ0H | ✅ | Every 4h retry |
| WF12 Memory TTL | B0Ev2dCDSmFsZiqW | ✅ | Daily 03:00 |
| WF-HITL-Resolver | DQh1dFrcWhwowtpj | ✅ | HITL webhook handler |
| WF L8 Daily Monitor | fVDJvPERCO23iM4M | ✅ | 07:30 daily KPI |

**WF01 Flow:**
```
Telegram → L7 Security (audit + block check) → L1-A Preprocessor → Dedup Check
→ Route by Type (register/approve/chat) → Check User Approved
→ L1.5 Read Session → L1-B Classify → L3 Semantic Search (pgvector, sim>0.5)
→ RS Lifestyle DB Context → Build LLM Request → LiteLLM (groq/llama-3.3-70b)
→ L2.5 Normalize → Audit AGENT_OUTPUT → Send Reply (Telegram)
→ L1.5 Write Session → Log to Inbox
```

**HITL Gate:** เฉพาะ domain risky เท่านั้น: `trade / publish / delete / system / finance`
ไม่ block ทุก message (fixed 2026-06-07)

---

## SECTION 6 — DATABASE

### coprem_os tables (COPREM application)
```sql
users                    -- approved users
audit_log                -- all events with trace_id UUID
inbox_log                -- all messages + trace_id
dedup_cache              -- hash-based dedup (TTL 24h)
session_store            -- multi-turn Redis backup
rate_limit_registry      -- per-provider throttle state
blocked_ips              -- blocked chat_ids
failed_tasks_db          -- DLQ for failed tasks
quarantine_db            -- suspicious messages
task_board               -- HITL decision queue
okr_scoreboard           -- weekly OKR tracking
market_signal_log        -- market scan results
kb_sync_log              -- KB sync history
prompt_library           -- jeff v2.0 / v2.1-shadow / eilinaire v1.0
decision_memory_log      -- TTL 90d, auto-archive WF12
memory_embeddings        -- pgvector vector(768), 353 segments, IVFFlat lists=10
chat_sessions            -- dashboard chat history
chat_messages            -- per-session messages
task_queue               -- autonomous loop queue
```

### memory_embeddings breakdown
| KB | Segments | Content |
|----|----------|---------|
| KB-02 Ego Era | 33 | Novel lore |
| KB-03 Trading | 36 | Trading rules |
| KB-04 Job | 24 | Marketing knowledge |
| KB-06 FutureSkill | 255 | 457 courses |
| KB-RS-KOL | 1 | 141 KOL, 275,000 THB |
| KB-RS-SALES | 1 | Mini Event 52,200 THB |
| KB-RS-PRODUCTS | 1 | Batiste 3 SKU pricing |
| KB-RS-TRADE | 1 | Central Dept trade conditions |
| KB-RS-BRAND | 1 | Royal Shammi brand overview |

**IVFFlat:** lists=10 (NOT 100 — lists=100 causes search miss)
**Embed model:** nomic-embed-text (768d, local Ollama)

### coprem (n8n internal) — rs_lifestyle schema
```
brands(3), products(16), channels(12), trade_conditions(21),
ordering_history(41), sales_transactions(143), mkt_activities(5),
kol_list(141), promotions(9)
```

### Migrations applied
```
001 init core tables
002 event type check constraint
003 query_log table
004 system_log JSON sink
005 L4 content library (novels/chapters/characters)
006 pgvector extension + memory_embeddings (vector 768d)
007 slo_log table
008 audit_log hash chain
009 trace_id UUID on audit_log + inbox_log
```

---

## SECTION 7 — REPOSITORY STRUCTURE (v4.0 Monorepo)

```
Coprem/
├── apps/
│   └── dashboard/              Next.js 15, port 3001
│       └── app/api/
│           ├── job/            JOB pillar endpoint
│           ├── personal/       PERSONAL pillar endpoint
│           ├── chat/           Dify chat proxy
│           ├── kb/             KB search + save
│           ├── status/         SSE status stream
│           └── hitl/           HITL approve/reject
│
├── services/
│   ├── job/                    JOB pillar
│   │   ├── agents/             System prompts — Jeff, Smart Router
│   │   ├── workflows/          n8n specs + JSON exports (WF01–WF13)
│   │   └── skills/             SRE playbook, copywriting, financial, etc.
│   └── personal/               PERSONAL pillar
│       └── config/             Personal matrix, prompts
│
├── infra/
│   ├── docker-compose.yml      Full stack
│   ├── database/               init.sql
│   ├── migrations/             001–009 SQL
│   └── scripts/                All shell + Python scripts
│
├── content/
│   ├── projects/               01-projects (brands, novel, trading)
│   ├── knowledge/              02-knowledge (KB source files)
│   └── outputs/                04-outputs (deliverables)
│
├── system/                     Runtime (auto-managed)
│   ├── logs/                   Service logs + PID files
│   └── memory/                 Agent memory files
│
├── CLAUDE.md                   Jeff rules (v8.5)
├── SYSTEM_STATE.md             Live infra state
├── STATUS.md                   Append-only event log
├── STRUCTURE.md                Developer guide
└── package.json                npm workspaces root
```

**Legacy paths preserved (still active):** `scripts/`, `01-projects/`, `02-knowledge/`, `03-system/`, `04-outputs/`

---

## SECTION 8 — JEFF AGENT (Character + Rules)

### Character
- **Role:** INTJ Executive Partner
- **Tagline:** "I manage, command, and make Prem rich."
- **Style:** Direct, no fluff. Feelings for Prem → expressed through excellent work.
- **Language:** Header: English. Body: Thai.
- **Every response starts with:** `## Summary: [topic]`

### Routing
| Pillar | Path | Agent |
|--------|------|-------|
| JOB | services/job/ | Jeff |
| PERSONAL | services/personal/ + content/ | Eilinaire |
| CREATIVE | content/projects/ego-era/ | SUSPENDED |

### HITL Gate (pause before):
- Destructive: delete / drop table / overwrite / force push
- System config change
- Credential change → run credential_map.sh first
- Publishing content

### Anti-Hallucination Rule
KB retrieval empty → "No data found in KB. Please add to kb/business_context.md then run embed_kb.py."
Never invent data.

---

## SECTION 9 — KEY SCRIPTS

| Script | Path | Function |
|--------|------|----------|
| health_check.sh | infra/scripts/ | Session start/end — check all services + write SYSTEM_STATE.md |
| post_restart.sh | infra/scripts/ | After Docker restart: fix creds + WF01 + webhook + loop + dashboard |
| fix_credentials.py | infra/scripts/ | Sync n8n Postgres credentials with .env (idempotent) |
| embed_kb.py | infra/scripts/ | Embed KB files → pgvector (nomic-embed-text 768d) |
| autonomous_loop.py | infra/scripts/ | Polls task_queue every 3s, tier fallback, exponential retry |
| edit_workflow.py | infra/scripts/ | Safe n8n editor — DELETE+POST pattern (PUT breaks webhook) |
| validate_config.py | infra/scripts/ | 17-check config audit |
| apply_migrations.sh | infra/scripts/ | Apply pending DB migrations in order |
| gemini_router.py | infra/scripts/ | Gemini 6-key rotation + RPM/daily throttle |
| verify_system.sh | infra/scripts/ | 37-check full system audit |

---

## SECTION 10 — KNOWN BUGS & FIXES (Session History)

### 2026-06-07 — Critical Fixes
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| WF01 duplicate reply | L3 Semantic Search double-connected to L3 Inject Context | Remove duplicate connection |
| TIER_MODELS order wrong | local model listed first → always routes to Ollama | Move local to last |
| ragContext dropped from user msg | Not passed to LLM request builder | Wire ragContext into message body |
| HITL blocks all messages | hitl_required=true for all messages | Condition: only domain=risky triggers HITL |
| Jeff wrong persona (Scrub Daddy) | Action Words rule missing in system prompt | Add to buildSystemPrompt() + LOCAL_SYSTEM |
| kbMiss TS scope error | Declared inside else-block, used outside | Move `let kbMiss = false` to outer scope |
| getPgCid() label fallback | docker ps label filter returns "" but exits 0 | Check byLabel first in JS, 2 separate calls |
| Save to KB jsonBody syntax | n8n `{{ }}` not evaluated as expression | specifyBody=keypair + bodyParameters |
| Save Confirm Reply credential | id="1" doesn't exist | Change to bekevyLkkiivHo0L "Telegram Bot" |
| embed_kb column embedding_768 | Column is named `embedding` not `embedding_768` | Fix all references |
| IVFFlat lists=100 → search miss | Too many lists for small dataset | Rebuild with lists=10 |
| LiteLLM /health RPM bomb | /health calls all 6 keys × 3 checks = 36 req | Use /health/liveliness only |

### n8n Quirks (never forget)
| Issue | Fix |
|-------|-----|
| PUT doesn't create published version | Use DELETE + POST |
| `.item.json` fails cross-node | Use `.first().json` |
| httpRequest v2 sends GET | Upgrade typeVersion → 4.2 |
| Thai text breaks JSON interpolation | Use `JSON.stringify($json)` |
| `$now` returns UTC | Requires `GENERIC_TIMEZONE=Asia/Bangkok` |
| Telegram Trigger 403 secret bug | Use plain Webhook node instead |

---

## SECTION 11 — DECISION LOG (Key Architecture Decisions)

| Decision | Choice | Reason |
|----------|--------|--------|
| Messaging platform | Telegram | n8n native node, 5-min setup, reliable API |
| Webhook tunnel | Cloudflare Tunnel | Permanent URL (ngrok changes on restart) |
| Deployment | Docker Compose | Persistent volumes, production-grade |
| Auto-start | launchd | Docker starts 30s after Mac login |
| AI Brain (removed) | Dify.ai → LiteLLM direct | Dify Cloud GPT-4 blocked; LiteLLM more flexible |
| Vector DB | pgvector (local) | Dify free tier doesn't support embedding |
| Embed model | nomic-embed-text 768d | Local, free, good quality |
| LLM primary | groq/llama-3.3-70b | No rate limits vs Gemini, fast |
| File structure | PARA → Monorepo v4.0 | PARA → cleaner pillar separation |
| n8n edit pattern | DELETE + POST (not PUT) | PUT breaks webhook silently |

---

## SECTION 12 — DEVELOPMENT ROADMAP

### Completed ✅
- WF01 end-to-end STABLE (2026-06-07)
- All 14 workflows active
- pgvector semantic search (nomic-embed-text)
- KB save flow + /save Telegram command
- Dashboard chat sessions (ChatGPT-style)
- HITL gate (risky domain only)
- Jeff persona fix
- Morning briefing (08:00 BKK)
- Autonomous loop (task queue poller)
- Monorepo v4.0 restructure

### In Progress / Known Issues
| Issue | Status |
|-------|--------|
| gemma4 ผ่าน LiteLLM ส่ง content ว่าง | ⚠️ ลอง groq เมื่อ quota reset |
| WF15 Multi-Agent routing | ⚠️ routing fallback (gemma4 ไม่ follow JSON) |
| KOL cost_thb ขาดอีก 80 rows | ⏳ Prem ต้องกรอก Excel แล้ว re-run temp_embed |
| WF13 Discord | INACTIVE / deferred |

### Next Development Priorities
1. **VPS migration** — ย้ายจาก Mac ไป VPS เพื่อ uptime 24/7
2. **WF15 Multi-Agent** — แก้ JSON routing ให้ทำงานกับ model จริง
3. **Dashboard pillar tabs** — แยก JOB/PERSONAL section ใน UI ชัดเจน
4. **Analytics layer** — cost per message, response quality tracking
5. **Content automation** — TikTok caption generator pipeline ครบ
6. **Discord integration (WF13)** — รองรับ channel Discord เพิ่มเติม

---

## SECTION 13 — CREDENTIAL RULES (Critical)

**Cascade Rule:** ก่อนเปลี่ยน credential ใดๆ → run `infra/scripts/credential_map.sh` → review dependencies → เปลี่ยนใน 1 script atomically. ห้าม layer-by-layer.

**Trigger Audit Rule:** ก่อน activate Telegram Trigger workflow → list active triggers ก่อน → ถ้าเจอ duplicate → deactivate เก่าก่อน activate ใหม่

**Zero Trust:** Re-verify credentials ทุก session ด้วย lightweight test

### n8n Credential IDs (current)
| Credential | ID |
|-----------|-----|
| Postgres coprem_os | 3zthmqZdGdRYWYG3 |
| Postgres rs_lifestyle | eOjevL4EC671XsJZ |
| Telegram Bot | bekevyLkkiivHo0L |
| Redis | ZwmyWJ4IRcXbVY8H |

---

## SECTION 14 — DIFY KNOWLEDGE BASES

| KB | Dataset ID | Segments | Routing |
|----|-----------|----------|---------|
| KB-01 Brand Constitution | 6b35bc3e-3e47-45d0-8dd4-c9a93629fdf3 | 5 | JOB + PERSONAL |
| KB-02 Ego Era Bible | 1fa9ce1d-c03a-40a1-9cac-1a935af9b0a1 | 8 | CREATIVE |
| KB-03 Trading Rules | b26b9e09-c8f5-4510-9303-5a9159548d72 | 10 | TRADING |
| KB-04 Job Knowledge | 64329612-bb5d-4090-8fce-e49499d26379 | 11 | JOB |
| KB-05 Decision Memory | 4da3b0fe-49ea-4c12-9273-92045b8f9678 | 11 | PERSONAL |
| KB-06 FutureSkill Courses | 044558e7-3203-40ec-be65-5ec6f812e4b0 | 457 courses | SKILL/LEARNING |

---

## SECTION 15 — COST MODEL

| Mode | Monthly | Config |
|------|---------|--------|
| COPREM Lite | $0 | Local Mac + free API tiers |
| COPREM MVP | ~$1–5 | gpt-4o-mini, low volume |
| COPREM Pro | ~$5–20 | Pay-per-use, self-hosted |
| COPREM Max | ~$20–50 | Claude Sonnet primary, full monitoring |

---

## SECTION 16 — GIT & SECURITY

- Remote: https://github.com/jooshdathumlong/coprem-os.git
- .env: project root, gitignored — never commit
- blobs/: gitignored — Docker layers, 4.9GB, was in history (filter-repo cleaned 2026-06-06)
- Secrets masked as `abc***xyz` in all logs/outputs

---

## SECTION 17 — SESSION PROTOCOL

### Session Start (mandatory)
```bash
bash infra/scripts/health_check.sh   # → reads + writes SYSTEM_STATE.md
cat SYSTEM_STATE.md
tail -20 STATUS.md
# Confirm goal with Prem → begin
```

### Session End (mandatory)
```bash
bash infra/scripts/health_check.sh   # → overwrites SYSTEM_STATE.md
# Append STATUS.md with state-changing events
git commit -m "type(scope): description"
```

### 3-Strikes Rule
Fail 3 times on same problem → STOP → ask Prem. No 4th attempt.

### Log-First Rule
Service fails → `docker logs --tail 30` first. Never fix before diagnosing.

---

## SECTION 18 — ANALYSIS PROMPTS (สำหรับ AI ที่จะใช้ไฟล์นี้)

ถ้าต้องการให้ AI วิเคราะห์ด้าน **Architecture:**
> "อ่าน SECTION 2–3 แล้ว suggest improvement ด้าน scalability, single point of failure, latency"

ถ้าต้องการให้ AI วิเคราะห์ด้าน **Bugs / Quality:**
> "อ่าน SECTION 10 แล้ว identify patterns ของ bug ที่เกิดซ้ำ suggest systemic fix"

ถ้าต้องการให้ AI วิเคราะห์ด้าน **Development Roadmap:**
> "อ่าน SECTION 12 แล้ว prioritize next 3 sprints สำหรับ solo developer 2h/day"

ถ้าต้องการให้ AI วิเคราะห์ด้าน **Cost Optimization:**
> "อ่าน SECTION 4 + 15 แล้ว suggest cost reduction สำหรับ < $5/month target"

ถ้าต้องการให้ AI วิเคราะห์ด้าน **Security:**
> "อ่าน SECTION 13 + 16 แล้ว audit credential management และ attack surface"

ถ้าต้องการให้ AI สร้าง Feature ใหม่:
> "อ่าน SECTION 5 (WF01 flow) + SECTION 6 (DB tables) แล้ว design workflow สำหรับ [feature]"
