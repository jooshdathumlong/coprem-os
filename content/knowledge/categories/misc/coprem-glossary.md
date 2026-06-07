# COPREM Glossary — Terms & Definitions

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Agent Terms

| Term | ความหมาย |
|---|---|
| HITL | Human-in-the-Loop — ต้องให้ Prem approve ก่อนดำเนินการ |
| Pillar | กลุ่มงาน (JOB/PERSONAL/DEV/BIZDEV/RESEARCH/HR/FINANCE/QA/LEGAL/ANALYST) |
| Domain Boundary | ขอบเขตที่ agent ห้ามข้าม — เช่น Krit ห้ามทำ brand strategy |
| Smart Router | L1-B classifier ที่ classify message → route ให้ agent ที่ถูกต้อง |
| 3-Strikes Rule | fail 3 ครั้ง → STOP → escalate → ห้าม attempt ครั้งที่ 4 |

## System Terms

| Term | ความหมาย |
|---|---|
| WF01 | Main Telegram webhook workflow |
| pgvector | PostgreSQL extension สำหรับ vector/semantic search |
| LiteLLM | Unified LLM API gateway |
| Dify | Agent UI platform |
| KB | Knowledge Base |
| SSOT | Single Source of Truth |

## Content Terms

| Term | ความหมาย |
|---|---|
| Hook | 3 วินาทีแรกของ TikTok — ต้องดึงคนไว้ |
| CTA | Call-to-Action — สิ่งที่อยากให้ผู้ชมทำหลัง consume content |
| UTM | URL parameter สำหรับ track traffic source |
| GMV | Gross Merchandise Value — มูลค่าสินค้าที่ขายได้ |
| ROI | Return on Investment = (Revenue - Cost) / Cost × 100% |
| KOL | Key Opinion Leader — influencer |

## Status Codes

| Code | ความหมาย |
|---|---|
| P0 | Critical — system down, data loss |
| P1 | High — feature broken, blocks workflow |
| P2 | Medium — degraded, workaround exists |
| P3 | Low — minor, cosmetic |
| HIGH/HOLD/PASS | Lex legal verdict |
| PASS/BLOCK | Quinn QA verdict |
