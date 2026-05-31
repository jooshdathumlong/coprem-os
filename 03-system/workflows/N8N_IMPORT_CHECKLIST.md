## SECTION Overview
# n8n Import Checklist — WF03 / WF05 / WF10 / WF11 / L1-C
# Run after: migrations applied | Credentials set in n8n UI

---

## SECTION Pre-flight

Before importing, verify credentials exist in n8n (Settings → Credentials):

| Credential | Type | Used by |
|-----------|------|---------|
| Telegram API | Telegram Bot | WF05, WF11 |
| Supabase (coprem_os) | Postgres | WF03, WF05, WF10, WF11, L1-C |
| Dify Jeff | HTTP Header Auth | L1-C |
| Dify Eilinaire | HTTP Header Auth | L1-C |
| Dify Ego Era | HTTP Header Auth | L1-C |
| Google Drive | OAuth2 | WF10 |
| Redis | Redis | L1-C, WF11 |

---

## SECTION Import Order

Import in this order — later workflows depend on earlier ones:

### 1. L1-C Provider Router
```
File: 03-system/workflows/exports/WF_L1C_Provider_Router.json
n8n: Workflows → Import → select file
After import: set all Dify + Supabase credentials → Activate
```

### 2. WF05 HITL Decision Saver
```
File: 03-system/workflows/exports/WF05_HITL_Decision_Saver.json
After import: set Telegram + Supabase credentials → Activate
```

### 3. WF10 KB Sync
```
File: 03-system/workflows/exports/WF10_KB_Sync.json
After import: set Google Drive + Supabase + Dify credentials → Activate
Test: coprem.kb.sync("KB-01") via Telegram
```

### 4. WF11 DLQ Processor
```
File: 03-system/workflows/exports/WF11_DLQ_Processor.json
After import: set Supabase + Telegram + Redis credentials → Activate
```

### 5. WF03 Market Pulse Scanner
```
File: 03-system/workflows/exports/WF03_Market_Pulse_Scanner.json
After import: set Supabase credentials → Activate
Note: runs every 6h — verify cron trigger after activation
```

---

## SECTION Post-Import Verification

Run each check after importing all workflows:

```bash
# 1. All 5 workflows show Active in n8n UI

# 2. Send test message via Telegram → verify L1-C routes correctly
# Expected: reply within 10s, inbox_log row inserted

# 3. Trigger WF10 manually → verify kb_sync_log row inserted

# 4. Check WF11 — failed_tasks_db should be empty (no backlog)
# n8n → WF11 → Execute manually → check output

# 5. Verify system_log table receives n8n execution events
# (requires WF piping logs to system_log — Phase 2 task)
```

---

## SECTION Rollback

If any workflow causes errors after activation:
1. Deactivate workflow immediately in n8n UI
2. Check `failed_tasks_db` and `audit_log` for error details
3. Report to Jeff: `coprem.agent.jeff("WF<N> import failed — <error>")`
