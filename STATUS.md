# COPREM OS — Current Status

> Last Updated: 2026-05-31 | Session: Architecture Fix + DB Schema

---

## ✅ Done (v3.1.1)

**Infrastructure**
- Docker: n8n + Postgres + Redis + Cloudflared
- Telegram @Coprem_Bot + webhook (n8n.peabuntid.com)
- GitHub Actions: Self-hosted runner (coprem-mac) + CI/CD working
- Mac auto-start via launchd

**Database (Postgres — 15 tables)**
- users, inbox_log, task_board, okr_scoreboard, market_signal_log
- decision_memory_log, dedup_cache, session_store, rate_limit_registry
- audit_log, blocked_ips, failed_tasks_db, quarantine_db
- prompt_library, kb_sync_log

**Dify.ai**
- KB-01–05 ready
- 4 Agents: Smart Router, Jeff, Eilinaire, Ego Era

**n8n Workflows (active)**
- WF00A — User Registration (active, will be replaced by WF01)
- WF00B — User Approval (active, will be replaced by WF01)
- WF02 — Morning Brief (07:00 daily)
- WF03 — Market Pulse Scanner (every 6h, placeholder score)
- WF04 — Weekly OKR Review (Sunday 20:00)
- WF06 — Health Ping (every 6h)

---

## ⏳ Next Session

- [ ] Import WF01_Inbox_Single_Entry.json → replace WF00A/WF00B/WF01 (Dify)
- [ ] Deactivate old WF00A, WF00B, WF01 (Dify) after WF01 Single Entry is active
- [ ] Test full flow: /start → approve → send message → Dify reply
- [ ] Update WF02/WF03/WF04 to query real tables (task_board, market_signal_log, okr_scoreboard)
- [ ] Test Gemini (after 08:00 quota reset)
- [ ] Add Postgres credential in n8n for WF01 nodes

## 🚫 Blocked
- Gemini quota resets 08:00 daily

## Architecture Progress (Blueprint v8.2)
~30% complete

| Layer | Status |
|-------|--------|
| L0 Telegram Inbox | ✅ |
| L1-A Preprocessor | ✅ in WF01 JSON |
| L1-B Smart Router | ✅ Dify connected |
| L1-C Provider Router | ❌ |
| L1.5 Session Manager | ❌ |
| L2 Agents (Dify) | ✅ |
| L2.5 Normalizer | ✅ in WF01 JSON |
| L3 Memory/KB | ⚠️ KB only, no Vector |
| L4 Content Library | ❌ |
| L5 Feedback Loop | ❌ |
| L6 Cron Workflows | ⚠️ 6/11 |
| L7 Security | ❌ |
| L8 Monitoring | ❌ |

## Stack
```
n8n        → localhost:5678 (Docker)
Telegram   → n8n.peabuntid.com (Cloudflare)
Dify.ai    → cloud.dify.ai (4 agents)
Postgres   → Docker (15 tables)
Redis      → Docker (session cache)
GitHub CI  → self-hosted runner (coprem-mac)
```