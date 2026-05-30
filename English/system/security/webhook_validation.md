# L7 — Webhook Signature Validation

> Blueprint v8.2 | GAP-07 | Layer: L7 Security & Compliance
> **Current (MVP):** Telegram bot token validation via n8n Telegram Trigger node (built-in)
> **Future:** Discord Ed25519 + LINE HMAC-SHA256 when those platforms are added

---

## Current — Telegram (Active ✅)

n8n's Telegram Trigger node handles validation automatically via Bot Token.
No manual signature verification needed for Telegram.

**Env var:** `TELEGRAM_BOT_TOKEN` (stored in n8n Credentials → Coprem Bot)

---

## Future — Discord Ed25519 (when Discord added)

**Header:** `X-Signature-Ed25519` + `X-Signature-Timestamp`
**Env var:** `DISCORD_PUBLIC_KEY`

Rules:
- Verify Ed25519 signature against `timestamp + rawBody`
- Reject if timestamp age > 300 seconds (replay attack guard)
- On fail: return 401, log to audit_log, increment IP fail counter
- If IP fails > 5 times in 10 min → insert to blocked_ips (24h ban)

## Future — LINE HMAC-SHA256 (when LINE added)

**Header:** `X-Line-Signature`
**Env var:** `LINE_CHANNEL_SECRET`

Rules:
- Compute `HMAC-SHA256(LINE_CHANNEL_SECRET, rawBody)` → base64
- Compare with header value
- On fail: return 401, log to audit_log
