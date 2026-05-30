# ทะเบียน Knowledge Base — COPREM OS v8.2

> Layer: L3 Hybrid Memory & Retrieval
> Platform: Dify.ai
> Embedding: text-embedding-3-large | Retrieval: Hybrid Search | Top K: 5
> ไฟล์นี้เป็น Read-Only Mirror ของ `English/system/kb/kb_index.md`

## ทะเบียน KB

| KB | ชื่อ | Agent | ไฟล์ต้นฉบับ | Sync ล่าสุด |
|----|------|-------|-------------|------------|
| KB-01 | brand_constitution | Eilinaire | `projects/brands/eilinaire/eilinaire_constitution.md`<br>`projects/brands/peabuntid/peabuntid_constitution.md` | — |
| KB-02 | ego_era_bible | Ego Era | `projects/ego_era/ego_era_bible.md`<br>`projects/ego_era/character/**`<br>`projects/ego_era/awakenings/**` | — |
| KB-03 | trading_rules | Eilinaire | `projects/trading/rules.md` | — |
| KB-04 | job_knowledge | Jeff | `system/job/dept_marketing.md`<br>`system/job/dept_ops.md` | — |
| KB-05 | decision_memory | ทุก agent | Supabase ตาราง `decision_memory_log` (DB-backed) | Live |

## โปรโตคอล Sync
- ไฟล์ต้นฉบับเปลี่ยน → trigger Workflow-10 (KB Sync)
- Manual: `coprem.kb.sync("KB-01")` ผ่าน CLI
- ประวัติ sync: query ตาราง `kb_sync_log` ใน Supabase
- แจ้งเตือน: #coprem-alerts เมื่อ sync ล้มเหลว

## Lore Guard (KB-02 เท่านั้น)
- Ego Era Agent ตรวจสอบ KB-02 ทุกครั้งที่ output
- ตัวละครอยู่ผิดสถานที่ → output `LORE_CONFLICT` + หยุดทันที
- ต้องให้เปรมกด HITL ก่อนดำเนินการต่อ
