# Module 3 — n8n Workflow Orchestration

> Blueprint v8.2 | Layer: L6 Auto-Mode Cron + L1 Routing

Integration Engine. Connects 400+ services. All 11 COPREM workflows live here.

## Workflow Registry

| # | File | Schedule | Status |
|---|------|----------|--------|
| 01 | `workflows/01_inbox_receiver.md` | On webhook | Core pipeline |
| 02 | `workflows/02_morning_brief.md` | 07:00 daily | Cron |
| 03 | `workflows/03_market_scanner.md` | Every 6h | Cron |
| 04 | `workflows/04_okr_review.md` | Sunday 20:00 | Cron |
| 05 | `workflows/05_hitl_saver.md` | On webhook | Event |
| 06 | `workflows/06_health_ping.md` | Every 6h | Cron |
| 07 | `workflows/07_feedback_collector.md` | On webhook | Event |
| 08 | `workflows/08_self_optimization.md` | Sunday 22:00 | Cron |
| 09 | `workflows/09_backup.md` | Sunday 03:00 | Cron |
| 10 | `workflows/10_kb_sync.md` | On GDrive webhook / manual | Event |
| 11 | `workflows/11_dlq_processor.md` | Every 4h | Cron |

## Deployment
- Staging: `n8n-STG` — test in #coprem-staging
- Production: activate only after 10 test cases pass with score > 4.5
- CLI trigger: `coprem.workflow.trigger("workflow_name")`
