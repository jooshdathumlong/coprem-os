# Workflow 01 — Inbox Receiver (COPREM-MVP)

> **Live deployment:** Google Gemini (gemini-flash-latest) — 2026-05-30
> Upgrade to Claude Sonnet when Anthropic API key available.

**Trigger:** Webhook POST  
**Path:** `/webhook/coprem`  
**Schedule:** On demand  
**Status:** Core pipeline — always active

## Node Chain
```
[Webhook Trigger]
      ↓
[L7: Signature Validator] — Discord Ed25519 / LINE HMAC
      ↓ fail → [Return 401 + Audit Log]
[L1-A: Preprocessor] — dedup, normalize, lang detect
      ↓ duplicate → drop silently
[L1-B: Intent Classifier] — Dify Smart Router
      ↓ confidence < 0.7 → [Clarification Request → End]
[L1.5: Session Context Manager] — inject prior turns
      ↓
[HITL Gate] — if true → hold → post to #coprem-alerts → await
      ↓ approved
[L1-C: Provider Router] — rate limit + cost + model select
      ↓
[L2: Agent Execution] — Jeff / Eilinaire / Ego Era / Ollama
      ↓
[L2.5: Output Normalizer] — language, format, length, tone
      ↓
[Log to Inbox_Log]
      ↓
[Return response to source channel]
```

## Guardrails
1. Signature invalid → 401, never reaches L0
2. Duplicate hash (60s window) → silent drop
3. Timeout > 30s → route to Failed_Tasks_DB
