# Workflow 09 — Automated Backup

**Trigger:** Cron  
**Schedule:** Sunday 03:00  
**Output:** Google Drive `coprem-backups/YYYY-MM-DD/` + Git push

## Exports
- KB-05 (Decision_Memory_Log) → JSON
- Active prompt versions from Prompt_Library → JSON
- OKR_Scoreboard → CSV
- Task_Board (last 30 days) → CSV
- Inbox_Log (last 30 days) → CSV

## Steps
1. Export all above via Supabase/Sheets API
2. Zip into `coprem-backup-YYYY-MM-DD.zip`
3. Upload to Google Drive `coprem-backups/`
4. Git push backup branch
5. Post ✅ backup complete to #coprem-alerts
