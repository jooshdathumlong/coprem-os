# DB Schemas (Thai Mirror)

> Read-only mirror ของ `English/system/db/schemas/`
> SQL จริงอยู่ที่ฝั่ง English — รัน schema ใน Supabase จาก English เท่านั้น

| Schema | หน้าที่ |
|--------|---------|
| audit_log.sql | บันทึกเหตุการณ์ด้านความปลอดภัย |
| dedup_cache.sql | ป้องกันข้อความซ้ำ (TTL 60 วินาที) |
| rate_limit_registry.sql | ติดตาม API rate limits |
| session_store.sql | เก็บ session การสนทนา |
| kb_sync_log.sql | บันทึกการ sync KB |
| blocked_ips.sql | IP ที่ถูก block |
