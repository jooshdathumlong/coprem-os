# Module 3 — n8n Workflow Orchestration (ภาษาไทย)

> Blueprint v8.2 | Layer: L6 Auto-Mode Cron + L1 Routing
> ไฟล์นี้เป็น Read-Only Mirror ของ `English/system/n8n/README.md`

Integration Engine เชื่อมต่อบริการกว่า 400 รายการ Workflow ทั้ง 11 ตัวของ COPREM อยู่ที่นี่

## ทะเบียน Workflow

| # | ไฟล์ | กำหนดการ | สถานะ |
|---|------|----------|--------|
| 01 | `workflows/01_inbox_receiver.md` | เมื่อรับ webhook | Pipeline หลัก |
| 02 | `workflows/02_morning_brief.md` | 07:00 ทุกวัน | Cron |
| 03 | `workflows/03_market_scanner.md` | ทุก 6 ชั่วโมง | Cron |
| 04 | `workflows/04_okr_review.md` | อาทิตย์ 20:00 | Cron |
| 05 | `workflows/05_hitl_saver.md` | เมื่อรับ webhook | Event |
| 06 | `workflows/06_health_ping.md` | ทุก 6 ชั่วโมง | Cron |
| 07 | `workflows/07_feedback_collector.md` | เมื่อรับ webhook | Event |
| 08 | `workflows/08_self_optimization.md` | อาทิตย์ 22:00 | Cron |
| 09 | `workflows/09_backup.md` | อาทิตย์ 03:00 | Cron |
| 10 | `workflows/10_kb_sync.md` | เมื่อไฟล์ GDrive เปลี่ยน / manual | Event |
| 11 | `workflows/11_dlq_processor.md` | ทุก 4 ชั่วโมง | Cron |

## การ Deploy
- Staging: `n8n-STG` ทดสอบใน #coprem-staging ก่อน
- Production: เปิดใช้งานหลังผ่าน 10 test cases คะแนน > 4.5
- CLI: `coprem.workflow.trigger("ชื่อ workflow")`
