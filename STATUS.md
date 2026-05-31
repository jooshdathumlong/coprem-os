# COPREM OS — Current Status

> Last Updated: 2026-05-31 | Session: v3.2.0 — Workflows + SRE Playbook + CLAUDE.md Upgrade

---

## ✅ Done (v3.2.0)

**Infrastructure**
- Docker: n8n + Postgres (coprem + coprem_os) + Redis + Cloudflared
- GitHub Actions: runner + deploy (smoke test + rollback) + health + backup + pr-check
- Mac auto-start via launchd
- Branch Protection: `validate` status check required on main
- Pre-commit hook: portable via `scripts/hooks/` — blocks Thai in system files
- New machine onboarding: `sh scripts/setup.sh`

**Database**
- `coprem` → n8n internal only
- `coprem_os` → 15 COPREM tables (users, inbox_log, task_board, okr_scoreboard, market_signal_log, dedup_cache, session_store, rate_limit_registry, audit_log, blocked_ips, failed_tasks_db, quarantine_db, prompt_library, kb_sync_log, decision_memory_log)

**Dify.ai**
- KB-01–05 + 4 Agents (Smart Router, Jeff, Eilinaire, Ego Era)

**n8n Workflows (active / ready to import)**
- WF01 — Inbox Receiver Single Entry (Telegram → L1-A → Route → Dify → L2.5 → Log)
- WF02 — Morning Brief (07:00 daily) — queries task_board + inbox_log + okr_scoreboard
- WF03 — Market Pulse Scanner (every 6h) — logs to market_signal_log
- WF04 — Weekly OKR Review (Sunday 20:00) — queries okr_scoreboard by quarter
- WF05 — HITL Decision Saver (Webhook → DB → Telegram notify)
- WF06 — Health Ping (every 6h)
- WF10 — KB Sync Auto-Librarian (file → KB zone → Dify re-embed)
- WF11 — DLQ Processor (every 4h → retry → quarantine → killswitch warning)
- WF L1-C — Provider Router (model matrix + fallback chain + rate_limit_registry)

**CLAUDE.md v2**
- 12 sections, 25 laws (Rule 11: 18 execution guards)
- DICE prioritization framework with Score threshold
- Skill Vault: `03-system/skills/SRE_Master_Playbook.md` (rules 16–25)

---

## ⏳ Next Session

- [ ] Test WF01 full flow: /start → approve → chat → Dify reply (after 08:00 Gemini)
- [ ] Import WF03/05/10/11/L1-C into n8n + set credentials
- [ ] L1.5 Session Context Manager (Redis)
- [ ] L4 Content Library
- [ ] L7 Security Layer
- [ ] L8 Monitoring Layer

## 🚫 Blocked
- Gemini quota resets 08:00 daily

## Architecture Progress (Blueprint v8.2)
~55% complete

| Layer | Status |
|-------|--------|
| L0 Telegram Inbox | ✅ |
| L1-A Preprocessor | ✅ live in WF01 |
| L1-B Smart Router | ✅ Dify connected |
| L1-C Provider Router | ✅ WF built |
| L1.5 Session Manager | ❌ |
| L2 Agents (Dify) | ✅ |
| L2.5 Normalizer | ✅ live in WF01 |
| L3 Memory/KB | ✅ KB + WF10 auto-sync |
| L4 Content Library | ❌ |
| L5 Feedback Loop | ❌ |
| L6 Cron Workflows | ⚠️ 8/11 |
| L7 Security | ❌ |
| L8 Monitoring | ❌ |

## Stack
```
n8n        → localhost:5678 / n8n.peabuntid.com
Postgres   → coprem (n8n) + coprem_os (app, 15 tables)
Redis      → session cache
Dify.ai    → cloud.dify.ai (4 agents, 5 KBs)
GitHub CI  → coprem-mac runner
```
