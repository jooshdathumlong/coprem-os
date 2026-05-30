# L7 — Webhook Signature Validation

> Blueprint v8.2 | GAP-07 | Layer: L7 Security & Compliance

All inbound webhooks must be signature-validated before reaching L0.
Invalid requests → 401, logged to `audit_log`, IP tracked in `blocked_ips`.

---

## Discord — Ed25519 Validation

**Header:** `X-Signature-Ed25519` + `X-Signature-Timestamp`  
**Env var:** `DISCORD_PUBLIC_KEY`

Rules:
- Verify Ed25519 signature against `timestamp + rawBody`
- Reject if timestamp age > 300 seconds (replay attack guard)
- On fail: return 401, log to audit_log, increment IP fail counter
- If IP fails > 5 times in 10 min → insert to blocked_ips (24h ban)

## LINE — HMAC-SHA256 Validation

**Header:** `X-Line-Signature`  
**Env var:** `LINE_CHANNEL_SECRET`

Rules:
- Compute `HMAC-SHA256(LINE_CHANNEL_SECRET, rawBody)` → base64
- Compare with header value
- On fail: return 401, log to audit_log

## Env Vars Required

```
DISCORD_PUBLIC_KEY=<from Discord Developer Portal → App → General Information>
LINE_CHANNEL_SECRET=<from LINE Developers Console → Channel → Basic Settings>
SUPABASE_URL=<project URL>
SUPABASE_KEY=<service role key>
```

## n8n Node Position

Validation runs as the **first node** in Workflow-01, before L0 logic.
Failure branch → Return 401 → End. No retry.
