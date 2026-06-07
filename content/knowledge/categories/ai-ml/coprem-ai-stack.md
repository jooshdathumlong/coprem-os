# COPREM AI Stack — LLM & Agent Reference

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Models ที่ใช้ใน COPREM

| Model | Provider | ใช้ทำอะไร | Cost Tier |
|---|---|---|---|
| claude-sonnet-4-6 | Anthropic | Jeff main reasoning, complex tasks | $$$ |
| qwen2.5:3b | Ollama (local) | L1-B Smart Router classifier | Free |
| nomic-embed-text | Ollama (local) | pgvector embeddings | Free |
| gemini-pro | Google | Fallback เมื่อ cost >$1/day | $ |
| gemini-flash | Google | Fallback เมื่อ cost >$3/day | $$ |

## Cost Threshold Rules (CLAUDE.md Section 10)

| Threshold | Action |
|---|---|
| >$1/day | Thinking tasks → Gemini Pro |
| >$3/day | All tasks → Gemini Flash |
| >$5/day | Ollama only |
| Manual | Killswitch |

## Agent Roster

| Agent | Pillar | Model | หน้าที่ |
|---|---|---|---|
| Jeff | JOB | claude-sonnet-4-6 | Orchestrator |
| Krit | DEV | claude-sonnet-4-6 | IT Developer |
| Nova | BIZDEV | claude-sonnet-4-6 | Business Developer |
| Scout | RESEARCH | qwen2.5:3b | Research/Intelligence |
| Vera | HR | claude-sonnet-4-6 | Resource Manager |
| Rex | FINANCE | claude-sonnet-4-6 | CFO |
| Quinn | QA | claude-sonnet-4-6 | Quality Assurance |
| Lex | LEGAL | claude-sonnet-4-6 | Legal/Compliance |
| Analyst | ANALYST | qwen2.5:3b | Self-Audit |

## LiteLLM Config (Port 4000)

LiteLLM เป็น unified API gateway — ทุก agent call ผ่าน `http://litellm:4000/chat/completions`
- Anthropic, Ollama, Google ทั้งหมดรวมใน 1 endpoint
- Monitor spend: `GET http://litellm:4000/spend/logs`

## Prompt Engineering Rules

1. System prompt → กำหนด identity + domain boundary ให้ชัด
2. ทุก agent output ต้องมี `{ "agent": "name-v1.0", "pillar": "PILLAR" }` ท้าย response
3. Anti-hallucination: KB empty → บอก Prem ตรงๆ ห้าม invent
4. Temperature: 0.3 สำหรับ structured output, 0.7 สำหรับ creative
