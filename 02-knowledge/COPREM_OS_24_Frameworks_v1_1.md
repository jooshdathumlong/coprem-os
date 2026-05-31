# COPREM OS — 24 Framework Adaptation
**Strategic Architecture Intelligence Layer**

> Version: v1.1 | Date: 2026-05-31 | Based on Blueprint: v8.2 → v8.3
> Architect: Jeff | Owner: Prem
> Purpose: Map 24 enterprise frameworks to Coprem OS layers and extract actionable upgrades
> Cross-reference: `CLAUDE.md` §4 (DICE pre-scoring), §9 (L3 context), §11 (Blast Radius + RTO), §12 (migrations), §13 (event_type)

**How Jeff uses this file:**
- **Task scoring** → grep `## Implementation Priority Matrix` — pre-scored tasks skip DICE re-derivation (CLAUDE.md §4)
- **Blast radius** → grep `## Framework Interaction Map` before any infra change (CLAUDE.md §11)
- **Event types** → grep `### 13. Event Sourcing` for `event_type` taxonomy (CLAUDE.md §13)
- **Never read this file in full** — it is L3 context (grep-only). Full read = wasted session.

---

## Overview

This document adapts 24 enterprise architecture and system frameworks to Coprem OS v8.2.
Each framework is mapped to specific layers (L0–L8), rated by impact, and translated into
concrete implementation actions for the current stack (n8n + Dify.ai + Supabase + GSheets).

**Status key:**
- ✅ Already active / partially implemented
- 🔶 Gap exists — implementation planned
- ⬜ Strategic / future consideration

**Impact key:**
- 🔴 High — acts on current build gaps
- 🟡 Medium — strengthens existing architecture
- 🔵 Strategic — governs future scale

---

## CATEGORY A — Enterprise Architecture (Frameworks 01–04)

### 01. TOGAF (The Open Group Architecture Framework)

**Coprem Layer mapping:** L1 (Routing), L2 (Agents), L3 (Memory), L4 (Content), L5 (Feedback)
**Impact:** 🔡 Strategic | **Status:** ⬜ Implicit — not formally applied

**What it is:** A structured methodology for designing, planning, implementing, and governing enterprise
IT architecture. Its core tool is the Architecture Development Method (ADM) — a cycle of phases from
architecture vision to change management.

**Coprem adaptation:**

TOGAF ADM phases map directly to the Coprem Blueprint lifecycle:

| TOGAF ADM Phase | Coprem Equivalent |
|---|---|
| A — Architecture Vision | Blueprint v8.x cover: Core Properties + Layer Map |
| B — Business Architecture | Pillar model (JOB / PERSONAL / CREATIVE) |
| C — Information Systems | L3 Memory schema + 5 KB structure |
| D — Technology Architecture | n8n + Dify + Supabase + GSheets stack |
| E — Opportunities & Solutions | Scale Roadmap (Part 12) |
| F — Migration Planning | Week 1–4 Build Plan |
| G — Implementation Governance | Staging → Production criteria (10 tests, score > 4.5) |
| H — Change Management | L5 Cybernetic Feedback Loop + Prompt Shadow Testing |

**Action for v8.3:** When drafting the next Blueprint version, explicitly label each section with its
TOGAF ADM phase. This creates audit-ready documentation and reveals architecture gaps early.

---

### 02. Zachman Framework

**Coprem Layer mapping:** L1, L2, L8
**Impact:** 🔵 Strategic | **Status:** ⬜ Not applied

**What it is:** A 6×6 matrix for classifying architectural artefacts by interrogative (What / How /
Where / Who / When / Why) and stakeholder viewpoint (Planner / Owner / Designer / Builder / Sub-contractor / User).

**Coprem adaptation:**

| Zachman Interrogative | Coprem Artefact |
|---|---|
| What (Data) | Supabase tables — Inbox_Log, Task_Board, Trade_Journal |
| How (Function) | Agent system prompts (Jeff / Eilinaire / Ego Era) |
| Where (Network) | Telegram → n8n → Dify → Supabase topology |
| Who (People) | Prem (owner), Jeff (orchestrator), 3 agents |
| When (Time) | L6 Cron schedule — 7 workflows with time triggers |
| Why (Motivation) | KB-05 Decision_Memory_Log — the "why" of every decision |

**Action for v8.3:** Use the "Why" row (Motivation) to enforce the 90-day memory TTL rule.
Every KB-05 entry should record the motivation, not just the decision.

---

### 03. FEAF (Federal Enterprise Architecture Framework)

**Coprem Layer mapping:** L7 (Security), L8 (Monitoring)
**Impact:** 🔵 Strategic | **Status:** ⬜ Not applied

**What it is:** US Federal EA framework built around a Performance Reference Model (PRM) and
five reference models: Business, Data, Applications, Infrastructure, Security.

**Coprem adaptation:**

FEAF's Performance Reference Model maps directly to L8 KPIs:

| FEAF PRM Measurement Area | Coprem KPI |
|---|---|
| Mission and Business Results | Tasks completed vs failed (weekly OKR report) |
| Customer Results | Avg Feedback Score > 4.0 |
| Processes and Activities | Agent Success Rate > 95% |
| Technology | Uptime > 99% |
| Other Fixed Assets | API Cost/Day < $0.50 |

**Action:** Add a FEAF-style "Architecture Health Score" tab to the L8 GSheets dashboard that
aggregates all five KPIs into a single weekly maturity score.

---

### 04. DoDAF (Department of Defense Architecture Framework)

**Coprem Layer mapping:** L1 (Routing), L2 (Agents)
**Impact:** 🔵 Strategic | **Status:** ⬜ Future consideration

**What it is:** A framework for documenting operational, systems, and technical architectures.
Its Operational Views (OV) describe how a system operates in its environment.

**Coprem adaptation:**

DoDAF OV-1 (High-Level Operational Concept) is the most applicable view. It would document:

- Prem (Commander) → Telegram → L0 Inbox → L1 Router → L2 Agent → Response
- The three Pillars as Operational Nodes
- HITL gate as the Command Approval step

**Action:** Low priority for solo operation. Schedule for Month 4 when considering Coprem
expansion to team use (multiple users, multiple bosses, role-based access).

> **CLAUDE.md link:** §4 DICE — before scoring any infrastructure task, Jeff greps this file's Implementation Priority Matrix first. Pre-scored tasks do not need re-derivation.

---

## CATEGORY B — Cloud & System Design (Frameworks 05–10)

### 05. The Twelve-Factor App

**Coprem Layer mapping:** L0 (Inbox), L1 (Routing), L7 (Security)
**Impact:** 🔴 High | **Status:** ✅ Partially active (7 of 12 factors)

**Twelve-Factor audit for Coprem OS:**

| Factor | Coprem Status | Gap / Action |
|---|---|---|
| I. Codebase | ✅ GitHub repo (coprem-mac runner) | None |
| II. Dependencies | ✅ Docker Compose pins versions | Add Dify version lock |
| III. Config | ✅ n8n Credentials (never plaintext) | Add `.env.example` to repo |
| IV. Backing Services | ✅ Supabase / Redis as attached services | None |
| V. Build/Release/Run | ✅ GitHub Actions deploy workflow | None |
| VI. Processes | ✅ Stateless n8n workflows | None |
| VII. Port Binding | ✅ Cloudflare tunnel + ngrok | Migrate to static domain |
| VIII. Concurrency | 🔶 Single Mac M5 — no horizontal scale | Month 4+ concern |
| IX. Disposability | 🔶 Graceful degradation handles partial failure | Add SIGTERM handler to n8n |
| X. Dev/Prod Parity | 🔶 Staging uses same n8n/Dify instances | Separate STG Dify workspace |
| XI. Logs | 🔶 Logs scattered (GSheets + n8n UI) | Route to structured JSON sink |
| XII. Admin Processes | ✅ CLI commands (coprem.run / coprem.status) | None |

**Priority action:** Implement Factor XI — pipe n8n execution logs to a Supabase `system_log`
table as structured JSON. Feed L8 GSheets from this table instead of manual entries.

---

### 06. AWS Well-Architected Framework

**Coprem Layer mapping:** L3 (Memory), L7 (Security), L8 (Monitoring)
**Impact:** 🔴 High | **Status:** ✅ Partially mapped

**Five Pillars vs Coprem OS:**

| AWS Pillar | Coprem Implementation | Upgrade |
|---|---|---|
| Operational Excellence | L5 Cybernetic Feedback Loop + Prompt Shadow Testing | Automate OKR scoring |
| Security | L7 Sig Validation + Key Vault + blocked_ips | Add JWT per-agent auth |
| Reliability | Tiered Degradation T0→T4 + DLQ Processor | Define Recovery Time Objectives |
| Performance Efficiency | Rate Limit Registry + model selection matrix | Add latency tracking per model |
| Cost Optimization | Circuit Breaker ($0.30/$0.50/$1.00 triggers) | Add cost forecast in daily brief |

**Action:** Use the Well-Architected Lens as a monthly review checklist. Prem runs
`coprem.status()` + compares to the five pillars — flags go into KB-05 as architectural decisions.

---

### 07. MACH Architecture

**Coprem Layer mapping:** L1 (Routing), L2 (Agents), L3 (Memory)
**Impact:** 🔴 High | **Status:** ✅ COPREM IS MACH

**MACH validation checklist:**

| MACH Principle | Coprem Implementation |
|---|---|
| Microservices | 5 Modules communicate via REST/JSON only — decoupled by contract |
| API-first | All inter-layer communication is REST/JSON. No shared state, no direct DB calls across layers |
| Cloud-native | Dify.ai (agent cloud) + n8n (orchestration cloud) + Supabase (cloud DB) + GDrive (cloud storage) |
| Headless | No native UI — output delivered to Telegram / Discord / future web dashboard. Channel-agnostic |

**Action:** Register Coprem OS on the MACH Alliance principles page as a personal implementation
reference. At Month 3 dashboard build (Next.js), maintain headless principle — dashboard reads
from APIs, never directly from DB.

---

### 08. Event-Driven Architecture (EDA)

**Coprem Layer mapping:** L0 (Inbox), L1 (Routing), L5 (Feedback), L6 (Cron)
**Impact:** 🔴 High | **Status:** ✅ Core architecture — already EDA

**Coprem event taxonomy:**

| Event Type | Producer | Consumer | Workflow |
|---|---|---|---|
| UserMessage | Telegram | L0 → L1-A | WF-01 |
| IntentClassified | L1-B (Dify Router) | L1-C Provider Router | WF-01 |
| AgentOutput | L2 Agent | L2.5 Output Normalizer | WF-01 |
| FeedbackReceived | Prem (⭐ rating) | L5 Feedback Collector | WF-07 |
| PromptFlagged | L5 (score < 3) | L5 Shadow Test | WF-08 |
| TaskFailed | Any workflow | DLQ Processor | WF-11 |
| KBFileChanged | Google Drive | KB Sync Trigger | WF-10 |
| CronTick | Scheduler | Morning Brief / OKR / Market Scan | WF-02/03/04 |

**Action for v8.3:** Add `event_type` field to `audit_log` using the taxonomy above.
This creates a full event log for replay, debugging, and Chaos Engineering experiments.

---

### 09. Serverless Architecture

**Coprem Layer mapping:** L1 (Routing), L2 (Agents), L6 (Cron)
**Impact:** 🟡 Medium | **Status:** ✅ Behaviorally serverless (n8n workflows)

**Serverless properties in Coprem:**

- n8n workflows are stateless and event-triggered — serverless in behaviour
- Dify.ai agent calls are function-as-a-service calls
- Tiered Degradation (T0→T4) mimics serverless cold-start mitigation

**Gaps vs true serverless:**
- n8n runs on a persistent Mac M5 server — not truly serverless
- No automatic scaling on load spikes

**Action:** Move Workflow-10 (KB Sync) to Supabase Edge Functions (true serverless).
This offloads the heaviest vector re-embedding job from the Mac and runs it closer to the DB.

---

### 10. SOA (Service-Oriented Architecture)

**Coprem Layer mapping:** L1, L2, L3
**Impact:** 🟡 Medium | **Status:** ✅ Coprem exceeds SOA maturity

**SOA → Microservices evolution in Coprem:**

SOA requires: loose coupling, service contracts, reusability, composability.
Coprem already exceeds this with strict REST/JSON-only inter-layer contracts.

**Action:** Formalize the L1 → L2 service contract. Document the official
request/response schema per pillar in Blueprint v8.3:

```json
// L1 → L2 contract (per pillar)
{
  "pillar": "JOB|PERSONAL|CREATIVE",
  "domain": "string",
  "agent": "jeff|eilinaire|ego_era|ollama",
  "model": "claude-sonnet-4-6|...",
  "context": "string (≤500 tokens, compressed session)",
  "hitl_required": false,
  "metadata": { "session_key": "...", "msg_hash": "..." }
}
```

---

## CATEGORY C — Software Design & Data Patterns (Frameworks 11–16)

### 11. Domain-Driven Design (DDD)

**Coprem Layer mapping:** L2 (Agents), L3 (Memory), L4 (Content Library)
**Impact:** 🔴 High | **Status:** ✅ Pillar model = Bounded Contexts

**DDD concepts in Coprem:**

| DDD Concept | Coprem Implementation |
|---|---|
| Bounded Context | JOB / PERSONAL / CREATIVE pillars — no cross-pillar data leak |
| Aggregate Root | Each Agent (Jeff / Eilinaire / Ego Era) owns its context |
| Domain Events | audit_log events + feedback_score events |
| Repository | KBs (KB-01 to KB-05) — the domain's persistence layer |
| Ubiquitous Language | Agent prompt language = domain language |
| Anti-Corruption Layer | L1-B Classifier translates user intent into domain commands |

**Action:** Build a Domain Glossary in KB-04 (job_knowledge). Define terms like
"task," "decision," "signal," "draft," "trade" with domain-specific meaning per pillar.
Jeff uses this glossary when classifying ambiguous inputs.

---

### 12. CQRS (Command Query Responsibility Segregation)

**Coprem Layer mapping:** L1 (Routing), L3 (Memory)
**Impact:** 🔴 High | **Status:** ✅ Already implemented — not formally labelled

**CQRS mapping in Coprem:**

| Side | Operation | Coprem Implementation |
|---|---|---|
| Command (Write) | User sends message → agent acts → decision stored | Inbox_Log write, KB-05 update, Trade_Journal insert |
| Query (Read) | Agent retrieves context | coprem.fetch() → PGVector search → Top K=5 injection |

L1-B Classifier is the command router. L3 Retrieval is the query model.
These paths are physically separate (Dify chatflow vs Supabase RPC) — CQRS is already live.

**Action:** Label the CQRS split explicitly in the DB schema documentation.
Add a `query_log` table to track retrieval quality (query, retrieved_chunks, relevance_score)
for L5 feedback on memory performance.

---

### 13. Event Sourcing

**Coprem Layer mapping:** L3 (Memory), L5 (Feedback), L7 (Security)
**Impact:** 🟡 Medium | **Status:** 🔶 Partially active (audit_log is an event store)

**Event Sourcing principle:** Store state changes as an immutable sequence of events.
Reconstruct current state by replaying events.

**Coprem event stores:**

| Table | Event Store role | Gap |
|---|---|---|
| audit_log | Security events (webhook validations) | Missing event_type taxonomy |
| Decision_Memory_Log | Decision history (immutable by design) | Missing replay capability |
| Prompt_Library | Prompt version history | ✅ Already versioned |
| Inbox_Log | Full interaction history | ✅ Immutable log |

**Action:** Add `event_type` to `audit_log`. Define event types:
`WEBHOOK_RECEIVED`, `WEBHOOK_REJECTED`, `AGENT_CALLED`, `AGENT_OUTPUT`,
`HITL_REQUIRED`, `HITL_APPROVED`, `FEEDBACK_RECEIVED`, `PROMPT_PROMOTED`.
This enables full system state reconstruction from logs alone.

**Canonical `event_type` enum (use this in migration `002_add_event_type.sql`):**

| event_type | Producer | Layer |
|---|---|---|
| `WEBHOOK_RECEIVED` | L0 Inbox | L0 |
| `WEBHOOK_REJECTED` | L7 Sig Validator | L7 |
| `INTENT_CLASSIFIED` | L1-B Router | L1 |
| `AGENT_CALLED` | L1-C Provider Router | L1 |
| `AGENT_OUTPUT` | L2 Agent | L2 |
| `HITL_REQUIRED` | L1 / L2 | L5 |
| `HITL_APPROVED` | Prem (human) | L5 |
| `FEEDBACK_RECEIVED` | Prem (⭐ rating) | L5 |
| `PROMPT_PROMOTED` | L5 Shadow Tester | L5 |
| `KB_SYNC_TRIGGERED` | WF-10 | L3 |
| `TASK_FAILED` | Any workflow | L6 DLQ |
| `CRON_TICK` | Scheduler | L6 |
| `COST_ALERT` | Circuit Breaker | L8 |

> **CLAUDE.md link:** §13 Event Log — `audit_log` must include `event_type` enum. Jeff greps this section for the taxonomy before writing any migration.

---

### 14. Clean Architecture (Hexagonal / Onion)

**Coprem Layer mapping:** L1, L2, L3
**Impact:** 🟡 Medium | **Status:** ✅ Honoured by decoupled module design

**Dependency rule:** Inner layers must not depend on outer layers.

| Architecture Ring | Coprem Layer |
|---|---|
| Core Domain (innermost) | L2 Agents + L3 Memory (the "brain") |
| Application Layer | L1 Routing Engine (use cases — classify, route, normalise) |
| Infrastructure (outermost) | L0 Telegram, Supabase, GSheets, Google Drive |

**Dependency rule check:**
- ✅ L2 Agents call L3 via abstract KB retrieval API — not direct DB queries
- ✅ L1 Router never knows about Telegram specifics — L0 normalises input
- ⚠️ Gap: L2 Agents reference Dify.ai directly — abstract with a provider interface in v8.3

**Action:** Define an `AgentProvider` interface. Jeff/Eilinaire/Ego Era are implementations.
Ollama is an alternative implementation. This enables swapping Dify.ai without touching agent logic.

---

### 15. Microservices Architecture

**Coprem Layer mapping:** L1, L2, L3, L4, L5
**Impact:** 🔴 High | **Status:** ✅ 5 modules = 5 microservices

**Microservices health patterns in Coprem:**

| Pattern | Coprem Implementation |
|---|---|
| Circuit Breaker | Cost Circuit Breaker ($0.30/$0.50/$1.00 thresholds) |
| Dead Letter Queue | Failed_Tasks_DB + Workflow-11 DLQ Processor |
| Service Discovery | rate_limit_registry — dynamic provider routing |
| Health Check | Workflow-06 Health Ping every 6h |
| Bulkhead | Pillar isolation — JOB data never reaches PERSONAL agents |
| Saga Pattern | HITL Gate — multi-step approval before irreversible actions |

**Action:** Build a Microservices Dependency Map for Blueprint v8.3.
Visualise the 5 modules and their REST/JSON contracts as a service mesh diagram.

---

### 16. MVC (Model-View-Controller)

**Coprem Layer mapping:** L0 (Inbox), L1 (Routing), L2 (Agents)
**Impact:** 🔵 Strategic | **Status:** ⬜ Applies to Month 3 Next.js dashboard

**MVC allocation for Coprem Dashboard (Month 3):**

| MVC Component | Coprem Implementation |
|---|---|
| Model | Supabase tables (Inbox_Log, Task_Board, OKR_Scoreboard, Trade_Journal) |
| View | Next.js components — dashboard tabs, alert panels, command terminal |
| Controller | n8n API endpoints exposing read-only data to Next.js |

**Hard rule:** Dashboard is read-only via API. No View writes directly to Model.
All writes go through n8n workflows (Controller). No MVC bleed into agent logic layer.

---

## CATEGORY D — DevOps, SRE & Operations (Frameworks 17–21)

### 17. GitOps

**Coprem Layer mapping:** L5 (Feedback), L6 (Cron)
**Impact:** 🔴 High | **Status:** ✅ Active — GitHub Actions + coprem-mac runner

**GitOps maturity checklist:**

| GitOps Principle | Coprem Status | Action |
|---|---|---|
| Declarative configuration | ✅ docker-compose.yml + CLAUDE.md | Terraform for cloud infra |
| Versioned and immutable | ✅ Git history + Blueprint versioning | Tag releases (v8.2, v8.3) |
| Automatically applied | ✅ GitHub Actions deploy on push to main | Add smoke test gate ✅ done |
| Continuously reconciled | 🔶 No drift detection | Add weekly config diff check |

**Action:** Add branch protection rule on `main` — require `pr-check.yml` to pass
before merge. Already added (v3.1.2 Build Log). Next: implement weekly config
drift check that compares live n8n workflow versions against Git-committed JSON.

---

### 18. Infrastructure as Code (IaC)

**Coprem Layer mapping:** L7 (Security), L8 (Monitoring)
**Impact:** 🔴 High | **Status:** 🔶 scripts/setup.sh is IaC Level 1

**IaC maturity progression for Coprem:**

| Level | What | Status |
|---|---|---|
| L1 — Shell scripts | scripts/setup.sh + launchd auto-start | ✅ Active |
| L2 — Container orchestration | docker-compose.yml (n8n + Postgres + Redis) | ✅ Active |
| L3 — DB migrations | 15 tables in migration files | 🔶 Partially done |
| L4 — Cloud provisioning | Terraform: Supabase project + Cloudflare rules | ⬜ Month 4+ |
| L5 — Policy as Code | OPA rules for HITL gate conditions | ⬜ Month 6+ |

**Action for Month 2:** Convert all 15 DB table `CREATE TABLE` statements into
numbered migration files (001_init_core_tables.sql, 002_add_v82_tables.sql, etc.).
Include `pg_cron` schedules in migration 002. Commit to `/db/migrations/`.

**Migration file naming convention:**
```
db/migrations/
  001_init_core_tables.sql
  002_add_event_type_enum.sql       ← closes Framework 13 gap
  003_add_query_log.sql             ← closes Framework 12 gap
  004_add_system_log_json_sink.sql  ← closes Framework 05 Factor XI gap
```
Each file must be idempotent: `CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN IF NOT EXISTS ... END $$`.
Never edit an applied migration — always add a new numbered file.

> **CLAUDE.md link:** §12 Idempotency Rule — migration files enforce idempotency structurally. §11 Config as Code — migration files must be committed before being applied.

---

### 19. Site Reliability Engineering (SRE)

**Coprem Layer mapping:** L6 (Auto-Mode), L7 (Security), L8 (Monitoring)
**Impact:** 🔴 High | **Status:** ✅ SRE_Master_Playbook.md (rules 16–25) adopted

**Coprem SRE definitions:**

| SRE Concept | Coprem Definition |
|---|---|
| SLI (Service Level Indicator) | Agent Success Rate, Avg Feedback Score, API Cost/Day |
| SLO (Service Level Objective) | Success > 95%, Score > 4.0, Cost < $0.50/day |
| Error Budget | 5% failure tolerance = ~1.2h downtime/day allowed |
| Toil | Manual KB updates, manual HITL approvals, manual log checks |
| Toil Reduction | Workflow-10 KB Sync, Workflow-05 HITL auto-saver, L8 auto-report |

**Action:** Add SLO tracking to L8 GSheets. Create a daily row:
`date | success_rate | avg_score | cost_usd | uptime_pct | error_budget_remaining`.
Generate weekly SLO burn rate report in Sunday OKR review (Workflow-04).

---

### 20. CI/CD (Continuous Integration / Continuous Deployment)

**Coprem Layer mapping:** L5 (Feedback), L6 (Cron)
**Impact:** 🔴 High | **Status:** ✅ Active

**CI/CD pipeline audit:**

| Stage | Tool | Status | Gap |
|---|---|---|---|
| Lint / Type check | ESLint / pre-commit hook | ✅ | Add Thai-block to pre-commit |
| Unit tests | — | ⬜ | Add pytest for utility scripts |
| Integration tests | — | 🔶 | Add n8n workflow smoke tests |
| Agent tests | Manual Telegram test | 🔶 | Add automated agent eval script |
| Build | docker-compose build | ✅ | None |
| Deploy | GitHub Actions → coprem-mac runner | ✅ | None |
| Smoke test gate | Auto-rollback on failure | ✅ | None |
| Notify | Telegram alert on success/fail | ✅ | None |

**Action for Month 2:** Write an agent evaluation script:
send 10 test inputs to each agent via Dify API → assert output contains required JSON fields
→ fail CI if any assertion fails. This closes the "Agent Tests" gap in the Deployment Pipeline.

---

### 21. Chaos Engineering

**Coprem Layer mapping:** L5 (Feedback), L7 (Security), L8 (Monitoring)
**Impact:** 🟡 Medium | **Status:** ⬜ Not formally practiced

**Chaos Engineering for Coprem — experiment backlog:**

| Experiment | Hypothesis | Steady State | Blast Radius |
|---|---|---|---|
| Throttle Claude API | System degrades to Gemini (Tier 1) gracefully | Success rate > 95% | L1-C routing only |
| Kill Redis (session store) | Agents still respond (degraded context) | No task failures | L1.5 context injection |
| Corrupt KB-05 | HITL gates block all decisions | No auto-decisions made | L3 retrieval only |
| Inject malformed webhook | Sig validator rejects, audit_log records | No system state change | L0/L7 only |
| Force DLQ overflow (>20 items) | Killswitch warning sent to Prem | Alert within 15 min | L6 DLQ only |

**Action:** Schedule one Chaos experiment per month starting Month 3.
Run in staging environment only. Document in Build Log with hypothesis, result, fix.

---

## CATEGORY E — Security & Compliance (Frameworks 22–24)

### 22. Zero Trust Architecture

**Coprem Layer mapping:** L0 (Inbox), L7 (Security)
**Impact:** 🔴 High | **Status:** ✅ Core principle — enforced at L7

**Zero Trust principle: "Never trust, always verify."**

**Coprem Zero Trust audit:**

| ZTA Control | Coprem Implementation | Status |
|---|---|---|
| Identity verification | Ed25519 (Discord) + HMAC-SHA256 (LINE/Telegram) on every webhook | ✅ |
| Least privilege | Supabase Service Account scoped to COPREM_OS_DB only | ✅ |
| Micro-segmentation | No cross-pillar data: JOB data never reaches PERSONAL agents | ✅ |
| Continuous verification | rate_limit_registry + blocked_ips auto-blacklist | ✅ |
| Assume breach | audit_log records every event, including rejections | ✅ |
| Encrypted transit | Cloudflare tunnel + n8n credentials encrypted at rest | ✅ |

**Gap:** No per-agent authentication token. All agents share the same Dify.ai workspace.

**Action:** Add per-agent JWT tokens in v8.3. L1-C Provider Router injects the correct
agent token into each Dify API call. Token rotation on quarterly schedule with API key rotation.

> **CLAUDE.md link:** §11 Zero Trust Credentials — Jeff re-verifies credentials before every authenticated op. This is the session-level enforcement of the static ZTA controls above.

---

### 23. NIST Cybersecurity Framework (CSF)

**Coprem Layer mapping:** L7 (Security), L8 (Monitoring)
**Impact:** 🟡 Medium | **Status:** 🔶 Partially covered by existing controls

**NIST CSF 5 Functions mapped to Coprem:**

| NIST Function | Coprem Control | Gap |
|---|---|---|
| **Identify** | audit_log schema + asset inventory (KB list, table list in Blueprint) | No formal asset register |
| **Protect** | API key vault (n8n Credentials) + scoped Service Account + pre-commit hook | No RBAC for multi-user |
| **Detect** | L8 error rate monitoring + Health Ping (WF-06) + cost alerts | No anomaly detection |
| **Respond** | DLQ escalation + coprem.killswitch() + #coprem-alerts | No formal IR runbook |
| **Recover** | coprem.rollback() + P1–P5 Recovery Runbook (Part 11) | RTO/RPO not defined |

**Action:** Define RTO and RPO for each Priority scenario:
- P1 (L1 Router down): RTO = 5 min (Tier 3 auto-activates), RPO = 0 (stateless routing)
- P2 (Vector DB down): RTO = 2 min (keyword fallback), RPO = last KB sync
- P5 (Data breach): RTO = 30 min (key rotation), RPO = last audit_log snapshot

**Full RTO/RPO table (canonical — CLAUDE.md §11 references this):**

| Priority | Failure Scenario | RTO | RPO | Recovery path |
|---|---|---|---|---|
| P1 | L1 Router / n8n down | 5 min | 0 (stateless) | Tier 3 Ollama auto-activates |
| P2 | Vector DB / Supabase down | 2 min | Last KB sync | Keyword fallback in L1-B |
| P3 | Individual workflow failure | 10 min | Last STATUS.md entry | DLQ Processor auto-retry |
| P4 | Dify.ai agent unavailable | 3 min | 0 | Model failover in Provider Router |
| P5 | Data breach / key leak | 30 min | Last audit_log snapshot | Key rotation + blocked_ips update |

> **CLAUDE.md link:** §11 Recovery Targets — Jeff checks this table before starting any repair. If repair time will exceed RTO, escalate to Prem immediately.

---

### 24. DevSecOps

**Coprem Layer mapping:** L1 (Routing), L5 (Feedback), L7 (Security)
**Impact:** 🔴 High | **Status:** ✅ Partially active

**DevSecOps maturity for Coprem:**

| DevSecOps Control | Coprem Status | Action |
|---|---|---|
| Secrets scanning | ⬜ Not active | Add GitGuardian / git-secrets to pre-commit |
| SAST (Static Analysis) | ⬜ Not active | Add ESLint security rules to pr-check.yml |
| Dependency scanning | 🔶 Docker pins versions | Add Dependabot to GitHub repo |
| Security as code | ✅ HITL gate for all irreversible actions | Codify HITL conditions in YAML config |
| Shift-Left security | ✅ pre-commit hook blocks Thai in system files | Extend to block API key patterns |
| Audit logging | ✅ audit_log table — every webhook interaction | Add log integrity check (hash chain) |
| Penetration testing | ⬜ Not scheduled | Schedule quarterly Chaos Engineering experiments |

**Action for Month 2 (P0 security hardening):**
1. Add `git-secrets` pre-commit hook — scans for API key patterns before every commit
2. Add `eslint-plugin-security` to pr-check.yml CI
3. Add Dependabot config for Docker base image updates
4. Add log integrity: hash each `audit_log` row with the previous row's hash (blockchain-lite)

---

## Implementation Priority Matrix

Based on Blueprint v8.2 current status (Architecture 55% complete):

### Immediate (Week 5 — current sprint)

| Framework | Action | Layer |
|---|---|---|
| Twelve-Factor App (05) | Implement Factor XI — structured JSON log sink | L0/L8 |
| Event Sourcing (13) | Add event_type taxonomy to audit_log | L7 |
| DevSecOps (24) | Add git-secrets + ESLint security to CI | L7 |
| IaC (18) | Convert 15 DB tables to numbered migration files | L7 |

### Month 2 (Security hardening sprint)

| Framework | Action | Layer |
|---|---|---|
| CI/CD (20) | Agent evaluation script — 10 test cases via Dify API | L5 |
| SRE (19) | SLO tracking tab in L8 GSheets | L8 |
| DevSecOps (24) | Dependabot + log integrity hash chain | L7 |
| NIST CSF (23) | Define RTO/RPO for P1–P5 scenarios | L7 |

### Month 3 (Dashboard + observability)

| Framework | Action | Layer |
|---|---|---|
| MVC (16) | Next.js dashboard — Model/View/Controller allocation | L4 |
| AWS Well-Architected (06) | Monthly five-pillar review checklist | L8 |
| Chaos Engineering (21) | First chaos experiment — Claude API throttle | L5 |
| Serverless (09) | Move Workflow-10 KB Sync to Supabase Edge Functions | L3 |

### Month 4+ (Scale and governance)

| Framework | Action | Layer |
|---|---|---|
| TOGAF (01) | Label Blueprint sections with ADM phases | All |
| DDD (11) | Domain Glossary in KB-04 | L3 |
| Clean Architecture (14) | AgentProvider interface — abstract Dify dependency | L2 |
| DoDAF (04) | OV-1 diagram for team expansion planning | L1/L2 |

---

## Framework Interaction Map

Some frameworks reinforce each other in Coprem OS:

```
MACH (07) ←→ Microservices (15) ←→ Clean Architecture (14)
    ↕                ↕                      ↕
EDA (08)    ←→  CQRS (12)    ←→    Event Sourcing (13)
    ↕                ↕                      ↕
GitOps (17) ←→  CI/CD (20)   ←→    DevSecOps (24)
    ↕                ↕                      ↕
SRE (19)    ←→  Chaos (21)   ←→    AWS Well-Arch (06)
                   ↕
              Zero Trust (22) ←→ NIST CSF (23)
```

**The core triad powering Coprem OS today:**
- **EDA (08)** provides the event backbone
- **CQRS (12)** separates read and write paths
- **Zero Trust (22)** secures every boundary

Everything else extends and governs this triad.

---

## Frameworks Already Active in Coprem OS v8.2

Count: 8 of 24 fully or substantially active

1. **MACH (07)** — Coprem IS MACH by design
2. **EDA (08)** — Telegram webhook → n8n → Dify is textbook EDA
3. **CQRS (12)** — Read (fetch) and Write (log) paths are physically separate
4. **Microservices (15)** — 5 decoupled modules, REST/JSON contracts
5. **GitOps (17)** — GitHub Actions + coprem-mac runner + auto-rollback
6. **CI/CD (20)** — pr-check.yml + deploy workflow + smoke test gate
7. **SRE (19)** — SRE_Master_Playbook.md rules 16–25 + KPI targets
8. **Zero Trust (22)** — Sig validation on every webhook + scoped SA + blocked_ips

---

*End of document — COPREM OS 24 Framework Adaptation v1.1*
*Next review: post Month-2 audit | Maintained by Jeff | Owner: Prem*

---

## INDEX.md Registration

Register this file in `INDEX.md` with the following entry (one line):

```
02-knowledge/COPREM_OS_24_Frameworks_v1_1.md | Architecture backlog — 24 framework mappings, Priority Matrix, Framework Interaction Map | L3 grep-only
```
