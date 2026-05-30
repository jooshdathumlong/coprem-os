# COPREM OS - Decision Log

Jeff logs every important decision here after each session.
Format: Date | Topic | Reason | Outcome

---

## 2026-05-30

### Telegram instead of LINE/Discord
Reason: n8n has a native Telegram Trigger node, no signature verification needed, 5-minute setup.
Outcome: @Coprem_Bot is live, permanent webhook at n8n.peabuntid.com

### Gemini instead of OpenAI (MVP)
Reason: Gemini API key already available, no OpenAI key.
Outcome: Using gemini-2.0-flash, will switch to Claude Sonnet when Anthropic key is ready.

### Docker Compose instead of local n8n
Reason: Persistent volumes, data survives restarts, production-grade setup.
Outcome: n8n + Postgres + Redis + Cloudflared running in Docker.

### Cloudflare Tunnel + peabuntid.com instead of ngrok
Reason: ngrok URL changes every restart, Cloudflare is free and permanent, uses existing domain.
Outcome: n8n.peabuntid.com - permanent URL that never changes.

### PARA structure instead of English/Thai split
Reason: English/Thai folders were confusing in Obsidian, PARA is an international standard.
Outcome: 01-projects/ 02-knowledge/ 03-system/ 04-outputs/

### Mac launchd auto-start
Reason: Prem did not want to manually start services every time.
Outcome: Docker stack starts automatically 30 seconds after Mac login.

### Dify.ai as AI Brain layer
Reason: No-code agent platform with KB integration, free tier available.
Outcome: 5 KBs created - Brand, Ego Era, Trading, Job, Decisions.

---

## Decision Template (Jeff uses every session)

Topic: [decision topic]
Reason: [why this choice was made]
Outcome: [what happened as a result]
