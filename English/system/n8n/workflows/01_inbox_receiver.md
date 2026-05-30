# Workflow 01 — Inbox Receiver (COPREM-MVP)

> **Live deployment:** Google Gemini (gemini-flash-latest) — 2026-05-30
> Upgrade to Claude Sonnet when Anthropic API key available.
> **Export:** `English/system/n8n/exports/COPREM-MVP.json`

**Trigger:** Webhook POST
**Path:** `/webhook/coprem`
**Schedule:** On demand
**Status:** Live ✅ — tested 2026-05-30

---

## MVP Node Chain (Current — 4 nodes)

```
[Webhook]
  POST /webhook/coprem
  Respond: Using Respond to Webhook Node
      ↓
[Google Gemini — Message a Model]
  Model: models/gemini-flash-latest
  Messages:
    [1] Role: User  → {{ $json.body.message }}
    [2] Role: Model → Jeff system prompt
      ↓
[Code — Extract Reply]
  Extracts text from Gemini parts array
  Handles variable thoughtSignature output
  Output: { reply: "..." }
      ↓
[Respond to Webhook]
  JSON: { "reply": "{{ $json.reply }}" }
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

## Jeff System Prompt (Message a Model — Role: Model)

```
You are Jeff, INTJ Executive Partner for COPREM OS.
Answer concisely in Thai. Be decisive.
```

## Test

```bash
curl -X POST http://localhost:5678/webhook/coprem \
  -H "Content-Type: application/json" \
  -d '{"message": "สวัสดี วันนี้ต้องทำอะไรบ้าง"}'
```

Expected:
```json
{ "reply": "สวัสดีครับ..." }
```

## Full Pipeline (Future — v8.2 complete)

```
[Webhook] → [L7 Sig Validator] → [L1-A Preprocessor]
→ [L1-B Classifier] → [L1.5 Session Manager]
→ [HITL Gate] → [L1-C Provider Router]
→ [L2 Agent] → [L2.5 Output Normalizer]
→ [Log to Inbox_Log] → [Respond]
```

## Guardrails
1. Signature invalid → 401, never reaches L0
2. Duplicate hash (60s window) → silent drop
3. Timeout > 30s → route to Failed_Tasks_DB