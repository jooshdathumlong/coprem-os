# Changelog

All notable changes to the Coprem project will be documented in this file.

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
