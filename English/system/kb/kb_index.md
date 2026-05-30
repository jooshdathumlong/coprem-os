# Knowledge Base Index — COPREM OS v8.2

> Layer: L3 Hybrid Memory & Retrieval  
> Platform: Dify.ai  
> Embedding: text-embedding-3-large | Retrieval: Hybrid Search | Top K: 5

## KB Registry

| KB | Name | Agent | Source Files | Last Sync |
|----|------|-------|-------------|-----------|
| KB-01 | brand_constitution | Eilinaire | `projects/brands/eilinaire/eilinaire_constitution.md`<br>`projects/brands/peabuntid/peabuntid_constitution.md` | — |
| KB-02 | ego_era_bible | Ego Era | `projects/ego_era/ego_era_bible.md`<br>`projects/ego_era/character/**`<br>`projects/ego_era/awakenings/**` | — |
| KB-03 | trading_rules | Eilinaire | `projects/trading/rules.md` | — |
| KB-04 | job_knowledge | Jeff | `system/job/dept_marketing.md`<br>`system/job/dept_ops.md` | — |
| KB-05 | decision_memory | All agents | Supabase `decision_memory_log` table (DB-backed, no static file) | Live |

## Sync Protocol
- Source file changes → trigger Workflow-10 (KB Sync)
- Manual: `coprem.kb.sync("KB-01")` through CLI
- Sync history: query `kb_sync_log` table in Supabase
- Alert channel: #coprem-alerts on sync failure

## Lore Guard (KB-02 only)
- Ego Era Agent cross-references KB-02 on every output
- Character location contradiction → output `LORE_CONFLICT` + HALT
- Resolution requires Prem HITL before proceeding
