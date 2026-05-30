# COPREM OS - Decision Memory

## 1. Platform Decisions

### Messaging Platform: Telegram
Selected Telegram over LINE and Discord as the primary messaging platform.
Reason: n8n has a native Telegram Trigger node requiring no signature verification, setup completes in 5 minutes, and the bot API is simple and reliable.
Outcome: @Coprem_Bot is live with a permanent webhook at n8n.peabuntid.com.

### AI Model: Google Gemini 2.0 Flash (MVP)
Selected Gemini over OpenAI as the MVP model.
Reason: Gemini API key was already available. No OpenAI key was on hand.
Outcome: Using gemini-2.0-flash. Will switch to Claude Sonnet when Anthropic API key becomes available.

### Webhook Tunnel: Cloudflare Tunnel with peabuntid.com
Selected Cloudflare Tunnel over ngrok for permanent HTTPS tunneling.
Reason: ngrok changes its URL on every restart. Cloudflare Tunnel is free, permanent, and uses an existing domain.
Outcome: n8n.peabuntid.com is the permanent webhook URL. It never changes on restart.

## 2. Infrastructure Decisions

### Deployment: Docker Compose
Selected Docker Compose over running n8n locally.
Reason: Docker provides persistent volumes so data survives restarts. It is production-grade and easy to migrate to a VPS later.
Outcome: n8n, PostgreSQL, Redis, and Cloudflared run as isolated Docker containers.

### Mac Auto-Start: launchd
Selected launchd to auto-start Docker on Mac login.
Reason: Prem did not want to manually start services every time the Mac is turned on.
Outcome: The full Docker stack starts automatically 30 seconds after Mac login.

## 3. Architecture Decisions

### File Structure: PARA
Selected the PARA method over the English/Thai split folder structure.
Reason: The English/Thai split was confusing to navigate in Obsidian and was not an international standard.
Outcome: Folders are now 01-projects, 02-knowledge, 03-system, 04-outputs.

### AI Brain: Dify.ai
Selected Dify.ai as the agent platform.
Reason: Dify.ai is a no-code agent platform with knowledge base integration and a free tier.
Outcome: 5 knowledge bases created covering Brand, Ego Era, Trading, Job, and Decisions.
