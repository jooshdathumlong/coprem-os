# Workflow 06 — Health Ping

**Trigger:** Cron  
**Schedule:** Every 6 hours  
**Output:** #coprem-alerts

## Checks
- n8n self-ping → expect 200
- Supabase connection → expect row count from audit_log
- Dify.ai agent status → expect 200 from health endpoint
- Ollama local → expect model list response

On all green: post `✅ Coprem alive | [timestamp]`  
On any fail: post `🔴 SYSTEM ALERT: [component] down` to #coprem-alerts
