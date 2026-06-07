# COPREM OS — Monorepo Structure v4.0

## Tree

```
Coprem/
├── apps/
│   └── dashboard/          Next.js 15, port 3001 — 1 unified UI
│       └── app/api/
│           ├── job/        JOB pillar endpoints
│           ├── personal/   PERSONAL pillar endpoints
│           ├── chat/       Dify chat proxy
│           ├── kb/         KB search
│           └── status/     System status stream
│
├── services/
│   ├── job/                JOB pillar (Jeff agent, WF01–WF13)
│   │   ├── agents/         System prompts — Jeff, Smart Router
│   │   ├── workflows/      n8n workflow specs + exports
│   │   ├── skills/         Tactical playbooks
│   │   └── config/         Dept configs (marketing, ops)
│   │
│   └── personal/           PERSONAL pillar (Eilinaire agent)
│       └── config/         Personal matrix, prompts
│
├── infra/
│   ├── docker-compose.yml  Full stack: n8n, Postgres, Redis, LiteLLM, Dify
│   ├── database/           init.sql — creates coprem_os DB + tables
│   ├── migrations/         001–009 numbered SQL migrations
│   └── scripts/            All shell + Python scripts
│
├── content/                Non-code content (read-only to services)
│   ├── projects/           Active projects per brand
│   ├── knowledge/          KB source files → Dify embed
│   └── outputs/            Finished deliverables
│
├── system/                 Runtime state — do NOT edit manually
│   ├── logs/               Service logs + PID files
│   ├── memory/             Agent memory files
│   └── monitoring/         Health + SLO data
│
├── CLAUDE.md               Jeff rules — session protocol, routing, HITL
├── SYSTEM_STATE.md         Live infra state (overwritten by health_check)
├── STATUS.md               Append-only event log
├── INDEX.md                Map of everything
└── package.json            Workspace root (npm workspaces)
```

## Database Layout (shared Postgres)

```
postgres container
├── coprem        n8n internal tables (owned by n8n)
└── coprem_os     COPREM application tables
    ├── users
    ├── inbox_log
    ├── session_store
    ├── query_log
    ├── audit_log
    ├── memory_embeddings  (pgvector)
    └── ...
```

Migrations are in `infra/migrations/` — numbered, idempotent.
Run: `bash infra/scripts/apply_migrations.sh`

## Running

```bash
# Full stack
cd infra && docker compose up -d

# Dashboard only
npm run dashboard        # from repo root

# Health check
npm run health
```

## Pillar Routing

| Pillar | Service | n8n Workflows | DB Schema |
|--------|---------|---------------|-----------|
| JOB | services/job | WF01–WF13 | coprem_os public |
| PERSONAL | services/personal | — | coprem_os personal.* (future) |
| CREATIVE | — (SUSPENDED) | — | — |

## Legacy Path Mapping

| Old | New |
|-----|-----|
| `01-projects/` | `content/projects/` |
| `02-knowledge/` | `content/knowledge/` |
| `03-system/dashboard/` | `apps/dashboard/` |
| `03-system/agents/` | `services/job/agents/` |
| `03-system/workflows/` | `services/job/workflows/` |
| `03-system/skills/` | `services/job/skills/` |
| `03-system/docker-compose.yml` | `infra/docker-compose.yml` |
| `03-system/db/migrations/` | `infra/migrations/` |
| `scripts/` | `infra/scripts/` |
| `04-outputs/` | `content/outputs/` |
