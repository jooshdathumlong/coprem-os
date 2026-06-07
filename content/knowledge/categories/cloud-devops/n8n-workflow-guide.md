# n8n Workflow Development Guide

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Edit Protocol (Critical)

**ใช้ DELETE + POST เสมอ — ห้ามใช้ PUT**
PUT อัพเดท workflow ได้แต่ webhook ไม่ register → silent failure

```python
# ถูก
DELETE /api/v1/workflows/{id}
POST   /api/v1/workflows  (payload ใหม่)

# ผิด — ห้ามใช้
PUT    /api/v1/workflows/{id}
```

หลัง edit ทุกครั้ง:
1. Restart n8n
2. Verify webhook registered
3. Test trigger ด้วย real message

## Credential IDs (ใช้ใน workflow JSON)

| Credential | ID | Type |
|---|---|---|
| Telegram Bot | bekevyLkkiivHo0L | telegramApi |
| Postgres coprem_os | rdxzBrj9putuOkku | postgres |
| LiteLLM Auth | 19EC9GJuiOtWm8cs | httpHeaderAuth |

## Workflow JSON Structure (API POST)

```json
{
  "name": "WF_NAME",
  "nodes": [...],
  "connections": {...},
  "settings": {"executionOrder": "v1"},
  "staticData": null,
  "pinData": {}
}
```

**Fields ที่ API ไม่รับ (ต้องไม่ใส่):**
id, updatedAt, createdAt, active, isArchived, versionId, tags, shared

## Node Types ที่ใช้บ่อย

| Type | ใช้ทำอะไร |
|---|---|
| n8n-nodes-base.scheduleTrigger | Cron trigger |
| n8n-nodes-base.httpRequest | HTTP call (LiteLLM, APIs) |
| n8n-nodes-base.postgres | DB query |
| n8n-nodes-base.telegram | ส่ง Telegram |
| n8n-nodes-base.code | JavaScript transform |
| n8n-nodes-base.if | Conditional branch |
| n8n-nodes-base.noOp | No operation (end branch) |

## Cron Expressions

| Expression | ความหมาย |
|---|---|
| `0 7 * * *` | ทุกวัน 07:00 |
| `0 23 * * *` | ทุกวัน 23:00 |
| `0 8 * * 1` | ทุกจันทร์ 08:00 |
| `0 22 * * 0` | ทุกอาทิตย์ 22:00 |
| `0 9 * * 1` | ทุกจันทร์ 09:00 |
