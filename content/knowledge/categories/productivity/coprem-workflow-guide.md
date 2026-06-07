# COPREM Workflow Guide — Daily Operating Procedures

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Daily Routine (Automated)

| เวลา | อัตโนมัติ | Agent |
|---|---|---|
| 07:00 | WF_SCOUT รัน — research daily intel | Scout |
| 08:00 | WF_VERA weekly report (จันทร์เท่านั้น) | Vera |
| On message | WF01 Inbox — Telegram → Jeff | Jeff |
| 22:00 | WF_ANALYST self-audit (อาทิตย์เท่านั้น) | Analyst |
| 23:00 | WF_REX cost report | Rex |

## Session Start Checklist (Manual)

```bash
bash infra/scripts/health_check.sh
cat SYSTEM_STATE.md
tail -20 STATUS.md
```

## Session End Checklist (Manual)

```bash
bash infra/scripts/health_check.sh  # overwrites SYSTEM_STATE.md
# Append STATUS.md
git commit -m "type(scope): description"
```

## Command Shortcuts (Telegram)

| Command | Agent | ผล |
|---|---|---|
| /caption [product] | Jeff | สร้าง TikTok caption |
| /description [product] | Jeff | สร้าง Shopee description |
| /kol [brief] | Jeff | สร้าง KOL brief |
| /campaign [idea] | Jeff | สร้าง campaign plan |
| /report | Jeff | Weekly report |

## Escalation Path

```
Task → Jeff (route) → Agent → Quinn (QA) → Lex (if content) → Prem (if HITL)
```

## 3-Strikes Rule

Agent fail 3 ครั้งกับ task เดิม → STOP → escalate to Jeff → Jeff ask Prem
ห้าม attempt ครั้งที่ 4 เด็ดขาด
