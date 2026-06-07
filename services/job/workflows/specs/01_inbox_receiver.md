# Workflow 01 — Inbox Receiver (COPREM-MVP)

> **Live deployment:** Telegram + Google Gemini (gemini-2.0-flash) — 2026-05-31
> **Status:** Live ✅ — tested and working
> **Export:          `03-system/workflows/exports/COPREM-MVP.json`

**Trigger:** Telegram Trigger (On message)
**Bot:** @Coprem_Bot
**Platform:** Telegram

---

## Node Chain (Current — 4 nodes)

```
[Telegram Trigger]
  Event: On message
  Bot: @Coprem_Bot
      ↓
[Google Gemini — Message a Model]
  Model: gemini-flash-latest
  Messages:
    [1] Role: User  → {{ $json.message.text }}
    [2] Role: Model → Jeff system prompt
      ↓
[Code in JavaScript — Extract Reply]
  Extracts text from Gemini parts array
  Output: { reply: "..." }
      ↓
[Telegram — Send a text message]
  Chat ID: {{ $('Telegram Trigger').item.json.message.chat.id }}
  Text:    {{ $json.reply }}
```

## Code Node — Extract Reply

```javascript
const data = $input.first().json;
let text = '';
if (data.text) {
  text = data.text;
} else if (data.content && data.content.parts) {
  text = data.content.parts
    .map(p => p.text || '')
    .join('')
    .trim();
}
return [{ json: { reply: text } }];
```

## Jeff System Prompt (Role: Model)

```
You are Jeff, INTJ Executive Partner for COPREM OS.
Answer concisely in Thai. Be decisive.
```

## Test

Send any message to **@Coprem_Bot** on Telegram → Jeff replies in Thai

## Credentials Required
- Google Gemini (PaLM) API — Gemini API key
- Telegram API — Bot token (@Coprem_Bot)

## n8n Setup
```bash
# Start n8n with Telegram support
WEBHOOK_URL=https://[ngrok-url] N8N_SECURE_COOKIE=false n8n start
```

## Future Pipeline (v8.2 complete)
```
[Telegram Trigger] → [L1-A Preprocessor] → [L1-B Classifier]
→ [L1.5 Session Manager] → [HITL Gate] → [L1-C Provider Router]
→ [L2 Agent] → [L2.5 Output Normalizer] → [Telegram Send]
```