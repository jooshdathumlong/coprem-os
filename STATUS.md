# COPREM OS — Current Status

> Last Updated: 2026-05-31 | Session: v3.1.2 — Architecture + DB + CI/CD

---

## ✅ Done (v3.1.2)

**Infrastructure**
- Docker: n8n + Postgres (coprem + coprem_os) + Redis + Cloudflared
- GitHub Actions: runner + deploy (smoke test + rollback) + health + backup + pr-check
- Mac auto-start via launchd

**Database**
- `coprem` → n8n internal only
- `coprem_os` → 15 COPREM tables (users, inbox_log, task_board, okr_scoreboard, market_signal_log, dedup_cache, session_store, rate_limit_registry, audit_log, blocked_ips, failed_tasks_db, quarantine_db, prompt_library, kb_sync_log, decision_memory_log)

**Dify.ai**
- KB-01–05 + 4 Agents (Smart Router, Jeff, Eilinaire, Ego Era)

**n8n Workflows (active)**
- WF01 — Inbox Receiver Single Entry (Telegram → L1-A → Route → Dify → L2.5 → Log)
- WF02 — Morning Brief (07:00 daily)
- WF03 — Market Pulse Scanner (every 6h, placeholder score)
- WF04 — Weekly OKR Review (Sunday 20:00)
- WF06 — Health Ping (every 6h)

**CLAUDE.md**
- 11 numbered sections: Routing, DNA, Rules, HITL, Paths, CLI, Reporting, Context Pyramid, File Standards, Execution, Idempotency

---

## ⏳ Next Session

- [ ] Test WF01 full flow: /start → approve → chat → Dify reply (after 08:00 Gemini)
- [x] Update WF02/WF03/WF04 queries → use real tables in coprem_os
- [x] Add `validate` status check to Branch Protection
- [x] WF05 HITL Decision Saver
- [ ] WF11 DLQ Processor
- [ ] L1.5 Session Context Manager (Redis)

## 🚫 Blocked
- Gemini quota resets 08:00 daily

## Architecture Progress (Blueprint v8.2)
~35% complete

| Layer | Status |
|-------|--------|
| L0 Telegram Inbox | ✅ |
| L1-A Preprocessor | ✅ live in WF01 |
| L1-B Smart Router | ✅ Dify connected |
| L1-C Provider Router | ❌ |
| L1.5 Session Manager | ❌ |
| L2 Agents (Dify) | ✅ |
| L2.5 Normalizer | ✅ live in WF01 |
| L3 Memory/KB | ⚠️ KB only |
| L4 Content Library | ❌ |
| L5 Feedback Loop | ❌ |
| L6 Cron Workflows | ⚠️ 5/11 |
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
