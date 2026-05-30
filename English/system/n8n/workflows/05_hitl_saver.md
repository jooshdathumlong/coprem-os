# Workflow 05 — HITL Decision Saver

**Trigger:** Webhook (Discord button / LINE quick reply)  
**Output:** KB-05 (decision_memory) + Inbox_Log status update

## Flow
1. Receive Approved / Reject signal from Prem
2. Update Inbox_Log: status = APPROVED or REJECTED
3. If APPROVED → execute held task
4. Save decision context to KB-05 (Decision_Memory_Log)
5. Log to audit_log
