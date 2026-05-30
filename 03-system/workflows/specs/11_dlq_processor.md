# Workflow 11 — Dead Letter Queue Processor [NEW v8.2]

**Trigger:** Cron  
**Schedule:** Every 4 hours  
**Output:** Retried tasks or escalated to Quarantine_DB

## Flow
1. Pull from Failed_Tasks_DB where retry_count < 3
2. Re-route through L1-C with reduced_mode = true (simpler prompt, Gemini Flash)
3. On success → mark resolved, archive task
4. On failure → increment retry_count
5. If retry_count >= 3 → move to Quarantine_DB + alert #coprem-alerts
6. If Quarantine_DB > 20 items → send killswitch warning to Prem
