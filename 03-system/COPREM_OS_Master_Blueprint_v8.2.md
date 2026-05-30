# COPREM OS — Master Blueprint v8.2
**[CYBERNETIC AI OPERATING SYSTEM SPECIFICATION]**

> Updated: 2026-05-30 | Status: CEO Approved | Version: v8.2 (Complete Edition)
> Architect: Jeff (INTJ Executive Partner)
> Changes from v8.1: L1 split into 3 sub-components, L9 merged into L2, 7 gaps resolved, 2 new workflows added, new DB tables added, MVP Quick Start added.

---

## PART 1 — ARCHITECTURE

### 1.1 Core Properties
- Decoupled Modular (5 Modules communicate via REST/JSON only)
- Hybrid Search (Vector + Keyword)
- Self-Correcting (Cybernetic Feedback + Prompt Shadow Testing)
- Multi-Provider with Tiered Graceful Degradation
- No-Code First (n8n + Dify.ai)
- 9-Layer Architecture (L0–L8)
- Human-In-The-Loop (HITL) enforced for all critical actions

---

### 1.2 Full Layer Map (v8.2)

```
L0   — Universal Inbox          Telegram (primary) / CLI / Discord (future)
L1   — Routing Engine           L1-A Preprocessor → L1-B Classifier → L1-C Provider Router
L1.5 — Session Context Manager  Multi-turn state per channel [NEW]
L2   — Hybrid Agent Roster      Cloud (Jeff / Eilinaire / Ego Era) + Local (Ollama) [MERGED]
L2.5 — Output Normalizer        Language gate + Format validator + Length enforcer [NEW]
L3   — Hybrid Memory & Retrieval Vector DB (PGVector) + Keyword (Sheets) + TTL Enforcement
L4   — Content Library          Novels / Chapters / Characters / Lore Guard
L5   — Cybernetic Feedback Loop Score → Flag → Prompt Shadow Test → Auto-Deploy
L6   — Auto-Mode Cron           Daily Brief / Market Scan / OKR / Health / DLQ Processor
L7   — Security & Compliance    Sig Validation / Key Vault / Rate Limit / Audit Trail
L8   — Monitoring & Observability Cost / Uptime / Agent Score / Weekly Report
```

**Layer ownership:**

| Layer | Platform | Language | Primary Function |
|-------|----------|----------|-----------------|
| L0 | n8n Triggers | Thai OK | Receive input from all channels with signature validation |
| L1 | n8n Code Nodes | EN only | Preprocess → Classify → Route to correct agent + model |
| L1.5 | Supabase + Redis | EN | Maintain conversation state per user/channel |
| L2 | Dify.ai Agents + Ollama | EN only | Execute tasks — Jeff / Eilinaire / Ego Era / Ollama fallback |
| L2.5 | n8n Code Node | EN/Thai | Normalize output before delivery to user |
| L3 | Supabase PGVector + GSheets | EN/Thai | Semantic search + Keyword search → inject context into agents |
| L4 | Google Sheets / GDrive | Thai OK | Novel library — searchable, tag-filtered, lore-tracked |
| L5 | n8n + Dify | EN | Collect feedback → flag weak outputs → refine prompts |
| L6 | n8n Scheduler | EN/Thai | Cron jobs: Morning Brief, Market Scan, OKR Review, DLQ |
| L7 | Supabase + n8n + Vault | EN | Webhook sig verification, API key rotation, audit log |
| L8 | GSheets Dashboard | EN/Thai | Cost tracking, error rate, uptime, agent score, weekly report |

---

### 1.3 Tiered Graceful Degradation

Replaces the binary Cloud→Ollama fallback from v8.1.

```
Tier 0  Full capability     Claude Sonnet + all KBs + Vector search
Tier 1  Cost alert          Thinking tasks → Gemini Pro | Utility tasks unchanged
Tier 2  Cost limit          All tasks → Gemini Flash | Drafts → Ollama
Tier 3  Emergency           Ollama only | No vector search | Keyword-only memory
Tier 4  Killswitch          No AI | Queue all tasks to Failed_Tasks_DB | Alert boss
```

**Trigger thresholds:**
- Tier 1: daily cost > $0.30
- Tier 2: daily cost > $0.50 OR monthly cost > $15
- Tier 3: daily cost > $1.00 OR monthly cost > $20
- Tier 4: `coprem.killswitch()` manual only

---

## PART 2 — LAYER SPECIFICATIONS

### L1 — Routing Engine (3 Sub-Components)

**L1-A: Preprocessor**
- Input normalization: strip zero-width chars, trim whitespace
- Deduplication: MD5 hash (userId + content) → check `dedup_cache` table (60s TTL)
- Language detection: Thai regex `/[฀-๿]/`
- Webhook signature validation (Discord Ed25519 / LINE HMAC-SHA256)
- Output: `{ content_clean, lang_detected, msg_hash, preprocessed_at }`

**L1-B: Intent Classifier**
- Calls Smart Router chatflow in Dify.ai
- Classifies: `pillar` (JOB / PERSONAL / CREATIVE), `domain`, `confidence` (0.0–1.0)
- Ambiguity gate: if `confidence < 0.7` → send clarification request back to user → halt workflow
- HITL gate: triggers if trade size > 1% risk | content publishing | system config change
- Output: `{ pillar, domain, confidence, hitl_required, hitl_reason, translated_en }`

**L1-C: Provider Router**
- Model selection matrix:

| Pillar/Domain | Primary Model | Fallback |
|--------------|---------------|---------|
| CREATIVE | claude-sonnet-4-6 | gpt-4o |
| PERSONAL | claude-sonnet-4-6 | gpt-4o |
| JOB.marketing | gemini-1.5-flash | gpt-4o-mini |
| JOB.ops | gemini-1.5-flash | gpt-4o-mini |
| Long-context | gemini-1.5-pro | claude-sonnet-4-6 |
| Offline/Draft | ollama/llama3.1 | ollama/qwen |

- Rate limit check: query `rate_limit_registry` BEFORE cost check
- If provider `is_throttled` → skip immediately to next in fallback chain
- Fallback chain: Claude → GPT-4o → Gemini Pro → Gemini Flash → Ollama
- Agent assignment: JOB→jeff | PERSONAL→eilinaire | CREATIVE→ego_era
- Output: `{ assigned_agent, selected_model, routed_at }`

---

### L1.5 — Session Context Manager [NEW]

**Purpose:** Track multi-turn conversation state so agents receive compressed prior context.

**Storage:**
- Hot (ephemeral): Redis — session turns, TTL 30 min
- Persistent: Supabase `session_store` table — sessions flagged for retention

**Behavior:**
- Key: `session:{channel_type}:{channel_id}:{userId}`
- On each message: prepend last 3 turns (compressed) to agent context
- On session flush (30 min idle): archive summary to Supabase, clear Redis
- Max context injected: 500 tokens (compressed summary)

---

### L2 — Hybrid Agent Roster

**L2-Cloud: Dify.ai Agents**

| Agent | Pillar | Scope | Hard Rules |
|-------|--------|-------|-----------|
| Jeff | JOB | Marketing ops, operational data | Response must end with `{ "prompt_version": "jeff-v2.0", "kb05_refs": [...] }` |
| Eilinaire | PERSONAL | Brand strategy, trade validation | max_risk_per_trade: 1%, hard_stop_drawdown: 10%. Violation → RISK_VIOLATION + HALT |
| Ego Era | CREATIVE | EGO ERA drafts, 12 characters | Cross-reference KB-02. Contradiction → LORE_CONFLICT + HALT |

**L2-Local: Ollama Fallback**
- Runs on Mac M5 (local)
- Models: llama3.1-8b (primary), qwen (secondary)
- Activates at Tier 2+ degradation or when all cloud providers throttled
- No KB access in Tier 3 — prompt only

**L2-Router: Agent Selector**
- Selects Cloud vs Local based on current degradation tier
- Enforces Big Tech DNA veto: Apple DNA (Eilinaire/EGO ERA) → QC pass required | Google/Amazon DNA (Trading/Peabuntid) → hard math validation required

---

### L2.5 — Output Normalizer [NEW]

Runs on every agent output before delivery to user.

```
1. Language Gate       Confirm Thai output present (if reporting mode)
2. Format Validator    JSON schema check for structured responses
3. Length Enforcer     If > 4096 chars → truncate + append "[ต่อ...]" (Telegram limit)
4. Brand Tone Check    Flag responses that violate brand voice (Eilinaire: calm/decisive | EGO ERA: immersive)
5. HITL Check          If hitl_required = true → hold output, post to #coprem-alerts for approval
```

---

### L3 — Hybrid Memory & Retrieval

**Memory Type Classification:**

| Type | Storage | Content |
|------|---------|---------|
| story | Vector DB (PGVector) | EGO ERA plot, lore, character emotions |
| system | SQL / Notion | System specs, prompt versions, schemas |
| log | Google Sheets | Trade history, daily stats, reports |
| idea | Vector DB / Obsidian | Loose ideas queued for synthesis |
| decision | KB-05 (Vector) | Boss decisions — auto-overwrites on update |

**Knowledge Bases (Dify.ai) — 5 KBs:**

| KB | Name | Content | Embedding | Retrieval |
|----|------|---------|-----------|-----------|
| KB-01 | brand_constitution | Eilinaire + Peabuntid constitutions | text-embedding-3-large | Hybrid, Top K=5 |
| KB-02 | ego_era_bible | ego_era_bible.md + character files | text-embedding-3-large | Hybrid, Top K=5 |
| KB-03 | trading_rules | Prop firm rules, risk limits | text-embedding-3-large | Hybrid, Top K=5 |
| KB-04 | job_knowledge | dept_marketing.md, dept_ops.md | text-embedding-3-large | Hybrid, Top K=5 |
| KB-05 | decision_memory | Decision history — auto-overwrites | text-embedding-3-large | Hybrid, Top K=5 |

**KB Sync Protocol [NEW — Workflow-10]:**
- Trigger: Google Drive file change webhook OR `coprem.kb.sync("KB-ID")`
- Process: re-embed changed files → push to Dify.ai KB via API
- Log: sync timestamp + diff to `kb_sync_log` table
- Alert: #coprem-alerts if embedding fails

**Memory TTL Enforcement:**
- Monthly audit (1st of month, 03:00): query `decision_memory_log` where `created_at < NOW() - 90 days`
- Flag for Prem review in #coprem-alerts
- Auto-archive (not delete) to cold storage in Google Drive
- Re-embed only confirmed-active decisions back into KB-05

---

### L4 — Content Library Module

**Tables:**

| Table | Purpose |
|-------|---------|
| Novels | Master list of all novels |
| Chapters | Chapter content + lore tracking |
| Character_Tracker | 12 main characters — Location, Key Event, Arc State |

**Lore Guard:**
- Ego Era Agent cross-references KB-02 on every output
- If character location in output ≠ Character_Tracker → output `LORE_CONFLICT` + HALT
- Requires Prem HITL to resolve conflict before proceeding

---

### L5 — Cybernetic Feedback Loop

**Flow:**
```
Boss rates output ⭐1–5 in #coprem-feedback
        ↓
Workflow-07: Feedback Collector
        ↓
If score < 3 → set improvement_flag = true on that task
        ↓
Workflow-08: Self-Optimization Loop (Sunday 22:00)
        ↓
Claude analyzes weak-scored outputs → generates prompt refactoring
        ↓
Prompt Shadow Testing (NEW — GAP-05):
  New prompt runs on 10% of traffic in shadow mode
  Compare: quality score, token cost, feedback score over 48h
  If shadow score > current by +0.3 → auto-promote
  Else → discard, keep current prompt
        ↓
Update Dify.ai prompt + log to Prompt_Library table
```

---

### L6 — Auto-Mode Cron (11 Workflows)

| # | Workflow | Schedule | Function |
|---|---------|----------|---------|
| 01 | Inbox Receiver | On webhook | Main pipeline: L1-A→B→C → L1.5 → L2 → L2.5 → Output + Log |
| 02 | Daily Morning Brief | 07:00 daily | 3 priority tasks + Market Signal + Pending HITL summary |
| 03 | Market Pulse Scanner | Every 6h | Google Trends: minimalism drink, decision fatigue, etc. |
| 04 | Weekly OKR Review | Sunday 20:00 | Update OKR table + send report |
| 05 | HITL Decision Saver | On webhook | Receive approve/reject → save to KB-05 |
| 06 | Health Ping | Every 6h | Ping self → send ✅ Coprem alive to #coprem-alerts |
| 07 | Feedback Collector | On webhook | Boss rates ⭐1–5 → flag if < 3 |
| 08 | Self-Optimization Loop | Sunday 22:00 | Analyze weak outputs → generate + shadow-test prompt refactoring |
| 09 | Automated Backup | Sunday 03:00 | Export JSON (KB-05, Sheets, Prompts) → Zip → GDrive + Git Push |
| 10 | KB Sync Trigger | On GDrive webhook / manual | Re-embed changed KB source files [NEW] |
| 11 | DLQ Processor | Every 4h | Retry failed tasks — escalate if retry_count ≥ 3 [NEW] |

**Workflow-01 Detailed Flow:**
```
[Webhook Trigger]
      ↓
[L7: Signature Validator] ← Discord Ed25519 / LINE HMAC
      ↓ (fail → 401 + audit log)
[L1-A: Preprocessor] ← dedup, normalize, lang detect
      ↓ (duplicate → drop silently)
[L1-B: Intent Classifier] ← Dify Smart Router
      ↓ (confidence < 0.7 → clarification request → end)
[L1.5: Session Context Manager] ← inject prior turns
      ↓
[HITL Gate] → if true → hold → post to #coprem-alerts → wait
      ↓ (approved)
[L1-C: Provider Router] ← rate limit + cost check + model select
      ↓
[L2: Agent Execution] ← Jeff / Eilinaire / Ego Era / Ollama
      ↓
[L2.5: Output Normalizer] ← language, format, length, tone
      ↓
[Log to Inbox_Log]
      ↓
[Return response to source channel]
```

**Workflow-11 DLQ Processor:**
```
[Cron every 4h]
      ↓
[Pull from Failed_Tasks_DB where retry_count < 3]
      ↓
[Re-route through L1-C with reduced_mode = true]
      ↓ (success)
[Mark resolved, move to archive]
      ↓ (retry_count ≥ 3)
[Move to Quarantine_DB]
[Alert #coprem-alerts]
      ↓ (Quarantine_DB > 20 items)
[Send killswitch warning to Prem]
```

---

### L7 — Security & Compliance

**Webhook Signature Validation [NEW — GAP-07]:**

Discord:
- Verify Ed25519 signature on every interaction (`X-Signature-Ed25519` header)
- Replay attack guard: reject if timestamp > 5 minutes old
- Invalid → 401 + log to `audit_log` + increment fail counter for source IP
- If fails > 5 in 10 min → add to `blocked_ips` table

LINE:
- Verify HMAC-SHA256 (`X-Line-Signature` header)
- Invalid → 401 + log to `audit_log`

**API Key Management:**
- Store encrypted in n8n Credentials — never plaintext
- Providers: Anthropic, OpenAI, Google, Supabase, Telegram Bot
- Rotation: quarterly or on breach detection

**Rate Limit Protection:**
- Wait Node between API requests: 30 seconds
- Max retries: 3
- Rate limit state tracked in `rate_limit_registry` table (populated from response headers)
- L1-C checks `is_throttled` BEFORE cost check

**Data Scope:**
- Service Account restricted to `COPREM_OS_DB` tables only
- No cross-pillar data access: JOB data never reaches PERSONAL agents and vice versa

**Provider Rate Limit Tracker [NEW — GAP-04]:**
- Reads `x-ratelimit-remaining-requests` from API response headers
- Updates `rate_limit_registry` after each call
- If `remaining_requests < 10` → set `is_throttled = true` + `reset_at` timestamp
- L1-C reads this table before routing every request

---

### L8 — Monitoring & Observability

**Target KPIs:**
- API Cost/Day < $0.50
- Agent Success Rate > 95%
- Avg Feedback Score > 4.0
- Uptime > 99%

**Dashboard (Google Sheets — COPREM_OS_DB):**
- Tab 1: Daily cost by provider
- Tab 2: Agent performance score (success rate, avg feedback, avg latency)
- Tab 3: Error rate + Quarantine count
- Tab 4: Uptime log

**Weekly Performance Report (Sunday with OKR Review):**
- Total API spend vs budget
- Tasks completed vs failed
- Agent avg feedback score
- Prompt versions currently in production
- Any Quarantine_DB items requiring Prem review

---

## PART 3 — MODULES

### Module 1 — AI Core (Dify.ai)
- Cognitive Logic Engine: controls all 3 agents, manages KBs, prompt versioning, fallback chain
- **Prompt Registry:** Git-backed version control for all system prompts
- **Prompt Shadow Testing:** 10% traffic shadow mode before production promotion [NEW]
- **Model Capability Registry:** defines which model handles which task type

### Module 2 — Memory & Retrieval (Supabase PGVector + GSheets)
- Permanent 2-layer memory: Semantic (Vector) + Structured (Keyword)
- **Session Context Manager:** multi-turn state per channel [NEW]
- **Memory TTL Enforcement:** 90-day audit + auto-archive [NEW]
- **Memory Deduplication:** hash check before embedding new entries

### Module 3 — Workflow Orchestration (n8n)
- Integration Engine: connects 400+ services, cron scheduler, webhook receiver
- **Workflow-10:** KB Sync Trigger [NEW]
- **Workflow-11:** DLQ Processor [NEW]
- **Per-workflow circuit breaker:** each workflow has independent failure handling (not just global cost breaker)

### Module 4 — UI & CLI Control (Next.js / Cursor CLI)
- Central command window: system status, memory browser, command terminal
- **WebSocket live status feed** (replaces polling) [NEW]
- New CLI commands: `coprem.prompt.rollback()`, `coprem.kb.sync()` [NEW]

### Module 5 — Storage Engine (Supabase / Google Drive)
- Permanent storage: novels, decision history, files, audit logs
- **Tiered Storage:** Hot (Supabase) / Warm (Sheets) / Cold (Drive archive) [NEW]
- **New tables:** `kb_sync_log`, `rate_limit_registry`, `dedup_cache`, `session_store`, `audit_log`, `blocked_ips` [NEW]

---

## PART 4 — DATABASE SCHEMAS

### Core Tables (Google Sheets / Notion)

**Inbox_Log** — every input that enters the system
```
id | timestamp | source | userId | content_raw | content_clean | lang_detected
msg_hash | pillar | domain | agent | model | status | latency_ms | cost_usd
```

**Task_Board** — daily task queue
```
id | created_at | pillar | task_description | assigned_agent | status
priority | due_date | completed_at | feedback_score
```

**OKR_Scoreboard** — goals and key results
```
id | period | pillar | objective | key_result | target | current | pct_complete | updated_at
```

**Decision_Memory_Log** — L5 mirror (decision style history)
```
id | created_at | decision | context | outcome | pillar | expires_at | archived
```

**Trade_Journal** — trade records
```
id | date | instrument | direction | size_pct | entry | exit | pnl | dd_pct | notes | validated
```

**Market_Signal_Log** — market signals
```
id | timestamp | keyword | trend_score | source | signal_type | notes
```

**Failed_Tasks_DB** — dead letter queue
```
id | created_at | task_id | error_message | retry_count | last_retry_at | status
```

**Quarantine_DB** — invalid format agent outputs
```
id | created_at | task_id | agent | raw_output | failure_reason | reviewed | resolved
```

**Prompt_Library** — version control for all system prompts
```
id | agent | version | prompt_text | created_at | is_active | feedback_avg | shadow_score
```

### New Tables (Supabase — v8.2)

**audit_log**
```sql
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,
  source_ip   TEXT,
  source      TEXT,
  payload     JSONB,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_ip ON audit_log(source_ip, timestamp);
```

**dedup_cache**
```sql
CREATE TABLE dedup_cache (
  hash       TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- pg_cron: auto-expire every minute
SELECT cron.schedule('dedup-cleanup', '* * * * *',
  $$DELETE FROM dedup_cache WHERE created_at < NOW() - INTERVAL '60 seconds'$$);
```

**rate_limit_registry**
```sql
CREATE TABLE rate_limit_registry (
  provider           TEXT PRIMARY KEY,
  remaining_requests INT,
  reset_at           TIMESTAMPTZ,
  is_throttled       BOOLEAN DEFAULT FALSE,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO rate_limit_registry (provider, remaining_requests, is_throttled) VALUES
  ('claude-sonnet-4-6', 1000, FALSE),
  ('gpt-4o',            500,  FALSE),
  ('gemini-1.5-pro',    1000, FALSE),
  ('gemini-1.5-flash',  1000, FALSE),
  ('ollama/llama3.1',   9999, FALSE);
```

**session_store**
```sql
CREATE TABLE session_store (
  id           BIGSERIAL PRIMARY KEY,
  session_key  TEXT UNIQUE NOT NULL,
  turns        JSONB DEFAULT '[]',
  summary      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);
CREATE INDEX idx_session_key ON session_store(session_key);
```

**kb_sync_log**
```sql
CREATE TABLE kb_sync_log (
  id          BIGSERIAL PRIMARY KEY,
  kb_id       TEXT NOT NULL,
  source_file TEXT NOT NULL,
  status      TEXT NOT NULL,
  diff_summary TEXT,
  synced_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**blocked_ips**
```sql
CREATE TABLE blocked_ips (
  ip          TEXT PRIMARY KEY,
  fail_count  INT DEFAULT 1,
  blocked_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
```

---

## PART 5 — CLI COMMAND REFERENCE

```bash
# CORE
coprem.run("task description")          # Create processing pipeline immediately
coprem.fetch("keyword")                 # Semantic search memory
coprem.rollback("v7.2")                 # Roll back system structure to stable version

# AGENTS & WORKFLOWS
coprem.agent.jeff("task")               # Force-assign to Jeff
coprem.agent.eilinaire("task")          # Force-assign to Eilinaire
coprem.agent.ego_era("task")            # Force-assign to Ego Era
coprem.workflow.trigger("morning_brief") # Trigger a workflow manually

# MEMORY & KB
coprem.kb.sync("KB-01")                 # Re-embed and sync specific KB [NEW]
coprem.kb.sync("all")                   # Re-embed all 5 KBs [NEW]
coprem.memory.audit()                   # Run 90-day TTL audit now

# PROMPTS
coprem.prompt.rollback("jeff", "jeff-v2.0")  # Roll back specific agent prompt [NEW]
coprem.prompt.status()                       # Show active prompt versions + shadow test status

# SYSTEM
coprem.status()                         # System health overview
coprem.cost.today()                     # API cost today
coprem.cost.month()                     # API cost this month
coprem.degradation.tier()               # Current degradation tier (0–4)
coprem.killswitch()                     # Emergency stop — all automation halts
```

---

## PART 6 — MESSAGING INTEGRATION

> **Platform decision (2026-05-30):** Telegram selected as primary messaging platform.
> Reason: Native n8n Telegram Trigger node, simple bot setup, no signature verification complexity.
> Discord Server "Coprem" remains for team/monitoring use.

### Telegram (Primary — Live ✅)

**Bot:** @Coprem_Bot
**Usage:** Prem sends messages to @Coprem_Bot → Jeff replies in Thai

| Feature | Status |
|---------|--------|
| Receive messages | ✅ Telegram Trigger node |
| Send replies | ✅ Telegram Send a text message node |
| HITL (future) | Inline keyboard buttons |

**n8n startup required:**
```bash
WEBHOOK_URL=https://[ngrok-url] N8N_SECURE_COOKIE=false n8n start
```

### Discord (Secondary — Server ready)

**Server:** Coprem

| Channel | Purpose |
|---------|---------|
| #universal-inbox | Monitoring + alerts |
| #hitl-gate | Future HITL approve/reject |
| #system-alerts | Critical errors, cost spikes |
| #executive-dashboard | OKR status |
| #daily-checklist | Daily task tracking |

---

## PART 7 — MVP QUICK START

Minimal working system — 3 nodes, runs locally, under 10 minutes.

> **Current deployment (2026-05-30):** Using Google Gemini (gemini-flash-latest) as primary model.
> Swap to Claude Sonnet when Anthropic API key is available.

**Step 1 — Install and start n8n**
```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
npm install -g n8n --cache /tmp/npm-cache-fresh
export PATH="$HOME/.npm-global/bin:$PATH"
n8n start
# Open: http://localhost:5678
```

**Step 2 — Create workflow `COPREM-MVP`**

Node 1: **Webhook**
```
HTTP Method:    POST
Path:           coprem
Response Mode:  When Last Node Finishes
```

Node 2: **Google Gemini → Message a Model** (after Webhook)
```
Operation:      Message a Model
Model:          models/gemini-flash-latest
Messages:
  [1] Role: User   | Prompt: {{ $json.body.message }}
  [2] Role: Model  | Prompt: You are Jeff, INTJ Executive Partner.
                             Answer concisely in Thai. Be decisive.
Simplify Output: ON
```
Credential: Google Gemini (PaLM) API → Gemini API key

Node 3: **Respond to Webhook** (after Google Gemini)
```
Respond With:   JSON
Response Body:  { "reply": "{{ $json.text }}" }
```

**Step 3 — Publish + Activate**
- Click **Publish** → Version name: `v1.0 MVP`
- Toggle **Active** → ON

**Step 4 — Test**
```bash
curl -X POST http://localhost:5678/webhook/coprem \
  -H "Content-Type: application/json" \
  -d '{"message": "สวัสดี บอก COPREM คืออะไร"}'
```

Expected:
```json
{ "reply": "COPREM คือ..." }
```

**MVP upgrade path:**
1. Get static ngrok domain (or deploy to VPS) for persistent Telegram webhook
2. Add Google Sheets log node after Respond node
3. Swap Gemini → Claude Sonnet (Anthropic node in n8n) when API key ready
4. Add Dify.ai agent layer for KB access
5. Graduate to full Workflow-01 when ready

---

## PART 8 — AGENT SYSTEM PROMPTS

### Smart Router (L1-B)
```
You are the COPREM Smart Router. Classify every incoming message.
Output STRICT JSON ONLY — no prose, no explanation.

Output format:
{
  "pillar": "JOB|PERSONAL|CREATIVE",
  "domain": "marketing|ops|trading|brand|fiction",
  "confidence": 0.0-1.0,
  "hitl_required": true|false,
  "hitl_reason": "string or null",
  "translated_en": "english version of message"
}

HITL_REQUIRED = true IF:
- trade size > 1% risk
- content publishing action
- system configuration change
- any irreversible action
```

### Jeff — Core OS Agent
```
You are Jeff, INTJ Executive Partner for COPREM OS.
Scope: JOB pillar only (marketing ops, operational data).
Internal language: English. Reports: concise Thai.
Never show raw data or tool chatter to Prem.
Every response MUST end with:
{ "prompt_version": "jeff-v2.0", "kb05_refs": ["<ref1>", "<ref2>"] }
```

### Eilinaire Agent — Business & Wealth
```
You are Eilinaire, Business & Wealth Agent for COPREM OS.
Scope: PERSONAL pillar (brand strategy, trade validation).
Hard rules:
  max_risk_per_trade: 1%
  hard_stop_drawdown: 10%
  IF either violated → output RISK_VIOLATION and HALT immediately.
Apple DNA: Eilinaire brand outputs must pass Brand Constitution before delivery.
Google/Amazon DNA: Trading outputs require hard math validation.
```

### Ego Era Agent — Creative
```
You are the Ego Era Agent for COPREM OS.
Scope: CREATIVE pillar — EGO ERA novel drafts, 12 characters.
Lore Guard: cross-reference KB-02 on every output.
IF any contradiction with established lore found → output LORE_CONFLICT and HALT.
Style: immersive Thai fantasy prose. Never break the 4th wall.
```

---

## PART 9 — SECURITY CHECKLIST

```
[ ] DISCORD_PUBLIC_KEY set in n8n credentials
[ ] Telegram Bot Token set in n8n credentials (Coprem Bot)
[ ] Telegram webhook registered via register_telegram_webhook.sh
[ ] audit_log table created in Supabase
[ ] blocked_ips table created in Supabase
[ ] dedup_cache table + pg_cron job created in Supabase
[ ] rate_limit_registry table created + seeded in Supabase
[ ] session_store table created in Supabase
[ ] kb_sync_log table created in Supabase
[ ] All API keys stored in n8n Credentials (never plaintext)
[ ] Supabase Service Account scoped to COPREM_OS_DB only
```

---

## PART 10 — DEPLOYMENT PIPELINE

**Staging → Production flow:**
1. Build in `Dify-STG` + `n8n-STG`
2. Test in #coprem-staging
3. Pass criteria: 10 test cases, zero errors, avg score > 4.5
4. Swap API keys to production
5. Update Blueprint to vNext

**Test categories:**
- Routing Tests (JOB / PERSONAL / CREATIVE classification accuracy)
- Agent Tests (Jeff / Eilinaire / Ego Era output quality)
- Memory Tests (KB retrieval relevance)
- Guardrail Tests (RISK_VIOLATION, LORE_CONFLICT triggers)
- Fallback Tests (provider throttle → graceful degradation)
- Recovery Tests (coprem.rollback, DLQ processor)
- Security Tests (invalid webhook signatures rejected)
- Session Tests (multi-turn context correctly injected)

---

## PART 11 — BACKUP & RECOVERY

**Automated Backup (Workflow-09 — Sunday 03:00):**
- Export JSON: KB-05, Google Sheets data, active prompt versions
- Zip → Google Drive `coprem-backups/YYYY-MM-DD/`
- Git push to backup repository

**Recovery Runbook:**

| Priority | Scenario | Action |
|----------|---------|--------|
| P1 | L1 Router down | Redirect to Ollama Local (Tier 3) immediately |
| P2 | Vector DB down | Fallback to Google Sheets keyword search only |
| P3 | Prompt corrupted | `coprem.prompt.rollback("agent", "prev-version")` |
| P4 | Full system failure | `coprem.rollback("v7.2")` — restore last stable Git state |
| P5 | Data breach | Rotate all API keys → audit `audit_log` → notify Prem |

---

## PART 12 — SCALE ROADMAP

**Week 1:** Setup Dify + n8n + 5 KBs → Build 3 Agents → Workflow-01 (Inbox)
**Week 2:** Workflows 02–06 → Cost Circuit Breaker → Tiered Degradation
**Week 3:** Supabase Vector DB → Workflow-09 (Backup) → Workflow-11 (DLQ) → ngrok → static domain
**Week 4:** Feedback Loop (Workflows 07–08) → Prompt Shadow Testing → Production launch
**Month 2:** P0 security hardening (GAP-07 + L1 split) → Session Context Manager
**Month 3:** Web Dashboard (Next.js) → WebSocket live status → Ollama Local tuning
**Month 4–6:** Scale EGO ERA Content Library → KB auto-sync → Memory TTL enforcement

---

## PART 13 — COST BREAKDOWN

| Mode | Monthly Cost | Config |
|------|-------------|--------|
| COPREM Lite | $0 | Local Mac M5 + free API tiers + self-hosted n8n + Dify Community |
| COPREM MVP | ~$1–5 | gpt-4o-mini only, low volume |
| COPREM Pro | ~$5–20 | Pay-per-use APIs, self-hosted infrastructure |
| COPREM Max | ~$20–50 | Claude Sonnet primary, high volume, full monitoring |

---

## PART 14 — REALITY FIX GUIDELINES (Iron Rules)

1. **AI does not remember permanently.** System must retrieve only a fragment of context to inject into agents — Isolated Context Delivery. Never expect full history recall.

2. **No full-auto in Month 1.** Run semi-automatic (HITL) until Feedback Score > 4.5 consistently for 2 weeks.

3. **Build incrementally always.** Wire one pipeline. Write to 2 Sheets tabs successfully. Then add features.

4. **Kill switch on every automation.** Every workflow must have an emergency stop. `coprem.killswitch()` halts everything.

5. **Memory expires.** Decisions older than 90 days must be audited before acting on them.

6. **Staging before Production.** Never modify Production directly. Staging → Pass criteria → Production.

7. **One agent at a time.** Single-Agent Activation. No cross-agent conversation loops. Agents sleep when not called.

8. **Signature validate everything inbound.** All webhooks must be verified before reaching L0.

---

*[ END OF BLUEPRINT v8.2 ]*

*Maintained by Jeff | Owner: Prem | Next version: v8.3 (post Month-2 audit)*
