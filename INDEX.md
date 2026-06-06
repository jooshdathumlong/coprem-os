# COPREM OS — Index (Map of Content)

> Version: 3.2.0 | Updated: 2026-06-06 | Structure: PARA

## How to Use This Index
- Read this file first (L2 in Context Pyramid)
- Find the file you need → grep its `## SECTION` header → Read offset+limit only
- Never read full files beyond CLAUDE.md and STATUS.md

---

## L1 — Always Loaded (auto)
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Rules, routing, token budget |
| `STATUS.md` | Current state, next session, blocked |

## L2 — Grep First
| File | Purpose | How to Read |
|------|---------|-------------|
| `INDEX.md` | This file — map of everything | Full (short) |
| `03-system/COPREM_OS_Master_Blueprint_v8.4.md` | Full system spec (v8.4) | `tail -30` for build log; `grep "## "` for TOC |

---

## 01-projects/ — Active Work
| Folder | Project | Status |
|--------|---------|--------|
| `eilinaire/` | Brand — Decision System | Active |
| `peabuntid/` | Brand — Trusted Curator Platform (TH) | Active |
| `ego-era/` | Fantasy Novel — EGO ERA | Active |
| `trading/` | The5ers Derivatives + Mutual Funds | Research |
| `music/` | Songwriter & Artist | Sandbox |

## 02-knowledge/ — Knowledge Base (→ Dify KBs)
| Folder | Content | Dify KB |
|--------|---------|---------|
| `brand/` | Eilinaire + Peabuntid SSOTs | KB-01 |
| `ego-era/` | Lore rules + style reference | KB-02 |
| `trading/` | Investment research | KB-03 |
| `job/` | Marketing + Ops dept knowledge | KB-04 |
| `personal/` | Mindset, learning, me SSOT | — |
| `work/business_context.md` | RS Lifestyle business data — brands, pricing, KOL, sales | — |
| `COPREM_Master_Context.md` | Full system snapshot — stack, KBs, scripts, session log | L1 read |
| `COPREM_Reference_Guide.md` | Quick-reference card | — |

## 03-system/ — COPREM OS Operational
| File/Folder | Content | Status |
|-------------|---------|--------|
| `COPREM_OS_Master_Blueprint_v8.3.md` | Full system spec | ✅ CEO Approved |
| `docker-compose.yml` | Docker stack: n8n+Postgres+Redis+Cloudflared | ✅ Live |
| `dashboard/` | Next.js dashboard (port 3001) | Phase 4 |
| `db/migrations/` | Numbered idempotent DB migrations (001–008) | ✅ Applied |
| `logs/` | Runtime logs + PID files | Auto-created |
| `memory/` | Agent memory files | Active |
| `manifests/` | Ollama model manifests | Active |
| `database/schemas.sql` | 15 DB tables (full schema) | ✅ Created |
| `workflows/specs/` | WF01–11 specifications (markdown) | Reference |
| `workflows/exports/` | n8n JSON exports (importable) | ✅ WF01–11 |
| `scripts/` | Shell scripts: register_telegram_webhook, setup | ✅ |
| `agents/` | System prompts: Jeff, Eilinaire, Smart Router | Reference |
| `job/` | dept_marketing.md, dept_ops.md | KB-04 source |

## 03-system/workflows/exports/ — Import-ready JSONs
| File | Workflow | Status |
|------|---------|--------|
| `WF01_Inbox_Single_Entry.json` | Single Telegram entry point (L1-A→L7→L1.5→Dify→L2.5) | ✅ Active |
| `WF02_Daily_Morning_Brief.json` | 07:00 daily brief | ✅ Active |
| `WF03_Market_Pulse_Scanner.json` | Market scan every 6h | ✅ Active |
| `WF04_Weekly_OKR_Review.json` | Sunday 20:00 OKR | ✅ Active |
| `WF05_HITL_Decision_Saver.json` | HITL approve/reject webhook | ✅ Active |
| `WF06_Health_Ping.json` | Health check every 6h | ✅ Active |
| `WF07_Feedback_Collector.json` | Boss rates ⭐1–5 → flag < 3 | ✅ Active |
| `WF08_Self_Optimization.json` | Sunday 22:00 weak output analysis | ✅ Active |
| `WF09_Automated_Backup.json` | Sunday 03:00 export + backup | ⏳ Ready to import |
| `WF10_KB_Sync.json` | GDrive webhook → Dify re-embed | ✅ Active |
| `WF11_DLQ_Processor.json` | Every 4h retry failed tasks | ✅ Active |
| `WF_L1C_Provider_Router.json` | Model matrix + fallback chain | ✅ Active |
| `WF_L1_5_Session_Context_Manager.json` | Redis multi-turn context | ✅ Active |
| `WF_L8_Daily_Monitor.json` | 07:30 daily KPI + SLO report | ✅ Active |

## .github/workflows/ — CI/CD
| File | Trigger | Status |
|------|---------|--------|
| `deploy.yml` | push to `03-system/` | ✅ Working |
| `health-check.yml` | every 15 min | ✅ Scheduled |
| `backup.yml` | Sunday 03:00 | ✅ Scheduled |

## 04-outputs/ — Deliverables
Finished work without a specific project home.

---

## Key Files Quick Reference
| File | One-liner |
|------|-----------|
| `CLAUDE.md` | Jeff brain — rules + context pyramid |
| `STATUS.md` | Current state + next session tasks |
| `03-system/COPREM_OS_Master_Blueprint_v8.3.md` | Full architecture spec |
| `03-system/database/schemas.sql` | All 15 DB table definitions |
| `02-knowledge/COPREM_Master_Context.md` | Full system snapshot — stack, KBs, scripts, quirks, session log |
| `03-system/docker-compose.yml` | Docker stack config |
| `.env` | API keys (never commit secrets) |
| `03-system/skills/SRE_Master_Playbook.md` | Advanced tactical rules 16–25 (DB, API, security, ops) |
| `02-knowledge/COPREM_OS_24_Frameworks_v1_1.md` | Architecture backlog — 24 framework mappings, Priority Matrix, Framework Interaction Map | L3 grep-only |
| `03-system/db/migrations/` | Numbered idempotent DB migrations (001–008) — source of truth for schema |
| `03-system/db/migrations/006_enable_pgvector.sql` | PGVector extension + memory_embeddings table (L3 semantic search) |
| `scripts/coprem` | CLI wrapper — coprem status, cost.today, kb.sync, killswitch, etc. |
| `.env.example` | Env var template for new machine setup — all keys, no real values || `scripts/fix_credentials.py` | Sync n8n Postgres credentials with .env password — run after every restart |
| `scripts/verify_system.sh` | 37-check system audit — paths, stale patterns, launchd, Python, .env |
| `scripts/docker_wait_start.sh` | Startup: polls Docker ready → compose up → pg_isready → post_restart |
| `scripts/post_restart.sh` | Self-healing after restart: credentials + zombie cleanup + Telegram webhook + loop + dashboard |
| `01-projects/prem-profile.md` | Prem profile (EN) |
| `01-projects/prem-profile-th.md` | Prem profile (TH) |
| `scripts/gemini_router.py` | Gemini 6-key rotation script (CLI) — daily/RPM quota detection |
| `03-system/litellm/config.yaml` | LiteLLM proxy config — 6 Gemini keys + Groq fallback |
| `scripts/apply_migrations.sh` | (auto-registered 2026-06-01) |
| `scripts/health_check.sh` | (auto-registered 2026-06-01) |
| `scripts/setup.sh` | (auto-registered 2026-06-01) |
| `02-knowledge/work/business_context.md` | RS Lifestyle business data — brands, pricing, trade conditions, KOL, sales |
| `03-system/database/` | init.sql (coprem_os tables) + schemas.sql — run in coprem_os not coprem DB |
| `scripts/sync_docs.sh` | (auto-registered 2026-06-01) |
| `scripts/build_master_context.py` | (auto-registered 2026-06-01) |
| `scripts/sqlite_io.py` | (auto-registered 2026-06-01) |
| `scripts/sync_daemon.py` | (auto-registered 2026-06-01) |
| `scripts/sync_validator.py` | (auto-registered 2026-06-01) |
| `04-outputs/command-center.html` | COPREM Command Center — single-page dashboard (Task + KB viewer + Jeff chat) |
| `04-outputs/coprem-dashboard.html` | COPREM Executive Dashboard v1 (system status + chat) |
