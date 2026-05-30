# COPREM OS — Current Status

> Jeff updates this at START and END of every session.

---

## Last Updated
2026-05-31 | Session: Dify.ai + Multi-user

## ✅ Done (v3.1.0)
- Docker: n8n + Postgres + Redis + Cloudflared
- Telegram @Coprem_Bot + webhook (n8n.peabuntid.com)
- Workflows 01–04, 06 active
- Dify.ai: KB-01–05 + 4 Agents (Smart Router, Jeff, Eilinaire, Ego Era)
- Multi-user: Self-registration + one-tap approval (WF00A + WF00B)
- Mac auto-start via launchd

## ⏳ Next Session
- [ ] Activate WF00A + WF00B in n8n UI
- [ ] Test Dify agents (Gemini quota resets 08:00)
- [ ] Connect n8n Workflow-01 → Dify Smart Router → Jeff
- [ ] Add Postgres credential in n8n for user DB

## 🚫 Blocked
- Gemini quota resets 08:00 daily

## Stack
```
n8n      → localhost:5678 (Docker)
Telegram → n8n.peabuntid.com (Cloudflare)
Dify.ai  → cloud.dify.ai (4 agents ready)
Postgres → Docker (users table ready)
```
