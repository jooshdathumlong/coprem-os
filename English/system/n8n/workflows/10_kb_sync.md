# Workflow 10 — KB Sync Trigger [NEW v8.2]

**Trigger:** Google Drive file change webhook OR `coprem.kb.sync("KB-ID")`  
**Output:** Updated Dify.ai KB + kb_sync_log entry

## Flow
1. Detect changed source file (e.g. eilinaire_constitution.md)
2. Map file → KB ID (see kb_index.md)
3. Re-embed changed file via Dify.ai KB API
4. Write to kb_sync_log: kb_id, source_file, status, synced_at
5. If embedding fails → alert #coprem-alerts

## Source → KB Mapping
| Source File | KB |
|-------------|----|
| eilinaire_constitution.md, peabuntid_constitution.md | KB-01 |
| ego_era_bible.md, character/* | KB-02 |
| trading/rules.md | KB-03 |
| job/dept_marketing.md, job/dept_ops.md | KB-04 |
| Decision_Memory_Log (DB) | KB-05 |
