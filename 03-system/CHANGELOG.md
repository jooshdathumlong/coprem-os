# Changelog

All notable changes to the Coprem project will be documented in this file.

## [3.1.0] - 2026-05-31

### Infrastructure — Docker Microservices Stack
- **Docker Compose:** n8n + PostgreSQL (pgvector) + Redis + Cloudflared as isolated containers
- **Persistent storage:** `./data/n8n`, `./data/db`, `./data/redis` volumes (never lost on restart)
- **PostgreSQL:** 6 COPREM schemas auto-applied on first run (`03-system/database/schemas.sql`)
- **Redis:** L1.5 session context manager (256MB LRU)

### Networking — Permanent Webhook
- **Cloudflare Tunnel:** `coprem-telegram` tunnel connected via Zero Trust
- **Domain:** `peabuntid.com` added to Cloudflare DNS (nameservers: annabel + troy)
- **Public hostname:** `n8n.peabuntid.com` → `http://n8n:5678` (permanent, no ngrok)
- **Telegram webhook:** `https://n8n.peabuntid.com/webhook/f101f08c-430f-49f9-a94c-605d498b6410`

### n8n Workflows (Docker instance)
- **COPREM-MVP:** Active ✅ — Telegram Trigger → Gemini 2.0 Flash → Code → Telegram Send
- **02 Morning Brief:** Active ✅ — Cron 07:00 daily
- **03 Market Scanner:** Active ✅ — Cron every 6h
- **04 OKR Review:** Active ✅ — Cron Sunday 20:00
- **06 Health Ping:** Active ✅ — Cron every 6h
- **Model:** Switched to `gemini-2.0-flash` (separate quota pool)

### File Cleanup
- Merged 6 SQL schemas → `03-system/database/schemas.sql`
- Merged 4 agent prompts → `03-system/agents/prompts.md`
- Merged dept_marketing + dept_ops → `03-system/job/departments.md`
- Deleted 8 stale/placeholder files

### Known pending
- Dify.ai + 5 KBs (Week 2)
- Workflows 05 HITL Saver, 07-11 (future)

---

## [3.0.5] - 2026-05-30

### File Reorganization
- Archive: `English/CLAUD.md` (superseded by CLAUDE.md)
- Archive: `English/system/scripts/line_oa_broadcast.py` (LINE removed)
- Archive: `English/system/scripts/obsidian_io.py`, `social_broadcast.py`, `google_apps_trigger.py` (not in v8.2)
- Archive: `English/outputs/plans/lean_blueprint.md` (superseded by Blueprint v8.2)
- Archive: `English/system/db/praem_os.db` (typo filename, stale)
- Remove: `Thai/system/db/Coprem.db` (Thai is read-only, no operational DB)
- Untrack: `English/system/db/Coprem.db` (added *.db to .gitignore)
- .gitignore: add `.obsidian/`, `*.db`, `*.sqlite`
- Create: `Thai/system/n8n/workflows/README.md`, `Thai/system/db/schemas/README.md`

---

## [3.0.4] - 2026-05-30

### Housekeeping
- Remove all stale LINE/Discord references across active docs — Telegram is now primary platform
- Update L0 description: Telegram (primary) / CLI / Discord (future)
- Fix L2.5 length limit: Discord 2000 → Telegram 4096 chars
- Update security/webhook_validation.md: Telegram active, Discord/LINE marked as future
- Update CLAUDE.md, README.md, Blueprint, Workflow-05 spec
- Prem's Telegram Chat ID captured: 7731591925
- Workflows 02–04, 06 imported to n8n (Morning Brief, Market Scanner, OKR Review, Health Ping)
- start_coprem.sh script created — one command to start all services

### Known Issues
- Gemini API daily quota exhausted — switch model to gemini-2.0-flash or wait for reset
- Workflows 02–06 show Active: False in n8n API — activate manually in UI
- ngrok URL changes on restart — need static domain for production

---

## [3.0.3] - 2026-05-30

### Telegram Integration Live
- **Platform switched:** Discord → Telegram as primary messaging platform
- **@Coprem_Bot** created and live — Prem sends message → Jeff replies in Thai
- **Workflow updated:** Telegram Trigger + Gemini + Code + Telegram Send a text message
- **COPREM-MVP.json** re-exported with Telegram nodes
- **Workflow-01 spec** fully updated with Telegram node chain
- **Blueprint Part 6** updated — Telegram primary, Discord secondary

### n8n Setup Note
- n8n must start with `WEBHOOK_URL=https://[ngrok] N8N_SECURE_COOKIE=false n8n start`
- ngrok required for Telegram webhook registration

---

## [3.0.2] - 2026-05-30

### Platform
- **Discord selected** as primary messaging platform (replaced LINE)
- Discord Server "Coprem" created with 5 channels: #universal-inbox, #executive-dashboard, #hitl-gate, #system-alerts, #daily-checklist
- Jeff Bot created and authorized to Coprem server
- Blueprint Part 6 updated with actual channel names

---

## [3.0.1] - 2026-05-30

### MVP Live
- **Workflow-01 COPREM-MVP:** Webhook → Google Gemini → Code → Respond to Webhook — tested and live
- **n8n v2.22.5** installed at `localhost:5678`
- **Model:** Google Gemini (gemini-flash-latest) — temporary until Anthropic API key available
- **Code node:** extracts text from Gemini variable parts array (handles thoughtSignature)
- **Export:** `English/system/n8n/exports/COPREM-MVP.json` — committed to GitHub
- **Workflow-01 spec** updated with full node chain, code, and test command

---

## [3.0.0] - 2026-05-30

### Architecture
- **Blueprint v8.2:** Upgraded from v8.1 (10-layer) to v8.2 (9-layer, L0–L8). L9 Ollama merged into L2 as fallback node. L1 split into 3 sub-components (L1-A Preprocessor, L1-B Classifier, L1-C Provider Router).
- **Two new half-layers:** L1.5 Session Context Manager, L2.5 Output Normalizer.
- **Tiered Graceful Degradation:** Replaced binary Cloud→Ollama fallback with 5 tiers (Tier 0 full → Tier 4 killswitch).

### Added
- **Module 3 (n8n):** `system/n8n/` directory with 11 workflow specs (01–11). Workflow-10 (KB Sync) and Workflow-11 (DLQ Processor) are new in v8.2.
- **DB Schemas:** `system/db/schemas/` with 6 Supabase SQL files: `audit_log`, `dedup_cache`, `rate_limit_registry`, `session_store`, `kb_sync_log`, `blocked_ips`.
- **L7 Security:** `system/security/webhook_validation.md` — Discord Ed25519 + LINE HMAC-SHA256 rules.
- **L8 Monitoring:** `system/monitoring/` — dashboard moved from root level.
- **L3 KB Index:** `system/kb/kb_index.md` — KB-01 through KB-05 source file mapping and sync protocol.
- **`_archive/`:** Stale v7.2 files preserved here (blueprints, Notion schema, setup guide, MCP connectors, plugins).

### Changed
- **Orchestration layer:** MCP connectors replaced by n8n as integration engine. `system/mcp_connectors/` archived.
- **Plugin system:** Claude plugins replaced by n8n workflows. `system/plugins/` archived.
- **Dashboard location:** `DASHBOARD.md` moved to `system/monitoring/dashboard.md` (L8).
- **Thai dashboard:** `คุมบังเหียน.md` moved to `Thai/system/monitoring/`.
- **`CLAUDE.md`:** Updated with v8.2 layer map, CLI commands, module map.
- **`README.md`:** Updated directory map to reflect v8.2 structure.

### Archived
- `COPREM OS Master Blueprint v8.1.docx` → `_archive/blueprints/`
- `COPREM_OS_v7.2_Blueprint.docx` → `_archive/blueprints/`
- `English/system/notion_schema_v7.2.md` → `_archive/v7.2/`
- `English/system/setup_guide_v7.2.md` → `_archive/v7.2/`
- `English/system/mcp_connectors/` (4 files) → `_archive/v7.2/`
- `English/system/plugins/` (3 files) → `_archive/v7.2/`
- `Thai/GEMINI.md` → `_archive/v7.2/`

---

## [2.0.0] - 2026-05-29

### Added
- **Version Control & History:** Initialized Git repository to track file history and versioning explicitly.
- **Versioning Standards:** Added `VERSION.md` and `CHANGELOG.md` to establish a clear version tracking system.
- **Thai Dashboard Mirroring:** Reconstructed the Dual-Vault architecture with a full Thai language mirror (`Thai/`) for the human-readable dashboard, ensuring absolute data isolation from the English backend (`English/`).
- **Compiled Context Updating:** Enhanced `sync_daemon.py` to auto-compile the Master Context (`master_context.md`) and stamp it with the current version from `VERSION.md`.

### Changed
- **System Architecture (The Twin Pillars):** Upgraded to a strict Objective-Driven Autonomous Matrix (10 pillars) via JSON-based tool delegation. Eliminated the 35 conversational personas to drastically reduce context overhead.
- **Master Lean Blueprint:** Transitioned to a No-Middleman Direct API Architecture (Lean/OSS), eliminating SaaS middleware.
- **Database & Storage (SSOT):** Enforced SQLite (`Coprem.db`) as the absolute Single Source of Truth for OKRs and states. Markdown files are strictly read-only exports for human review.

### Security
- **HITL Verification Protocol:** Implemented a Hard-In-The-Loop protocol requiring Prem's explicit `Approved` command before executing destructive, writing, or broadcasting tasks.
