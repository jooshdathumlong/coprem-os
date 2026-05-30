# COPREM OS — Master Directory

> **"Welcome back. Your empire is ready."** — Jeff (INTJ Executive)
> Version: 3.0.0 | Blueprint: v8.2 | Updated: 2026-05-30

Central operating system for Prem's projects, businesses, and knowledge. Maintained by **Jeff**.

---

## Architecture (v8.2 — 9 Layers, 5 Modules)

```
L0  Universal Inbox     →  L1  Routing Engine      →  L1.5 Session Manager
L2  Agent Roster        →  L2.5 Output Normalizer  →  L3  Memory & Retrieval
L4  Content Library     →  L5  Feedback Loop        →  L6  Auto-Mode Cron
L7  Security            →  L8  Monitoring
```

---

## Directory Map

### Core System
- `CLAUDE.md` — Jeff's brain: persona, layers, CLI commands, Twin Pillar routing
- `prem_profile.md` — Prem's master profile. Read every session.

### System (`system/`)
| Directory | Blueprint Layer | Purpose |
|-----------|----------------|---------|
| `system/prompts/` | Module 1 (AI Core) | Agent system prompts: Jeff, Eilinaire, Ego Era, Smart Router |
| `system/n8n/` | Module 3 (Workflows) | 11 n8n workflow specs |
| `system/db/` | Module 5 (Storage) | SQLite DB + OKR + goals |
| `system/db/schemas/` | Module 5 | 6 Supabase SQL schema files |
| `system/security/` | L7 | Webhook signature validation rules |
| `system/monitoring/` | L8 | Observability dashboard |
| `system/kb/` | L3 | KB-01–05 index and sync status |
| `system/job/` | JOB Pillar | dept_marketing, dept_ops, agents schema |
| `system/personal/` | PERSONAL Pillar | 10-pillar matrix, Grace HR |
| `system/skills/` | All agents | Playbook DB for agent learning |
| `system/scripts/` | Ops | Python scripts: sync_daemon, start_coprem, register_telegram_webhook, etc. |

### Knowledge Base (`knowledge/`)
- `knowledge/job/` — corporate context
- `knowledge/personal/` — personal project SSOTs (eilinaire, peabuntid, ego_era, trading, etc.)

### Projects (`projects/`)
| Project | Brand DNA | KB |
|---------|-----------|-----|
| `projects/brands/eilinaire/` | Apple DNA | KB-01 |
| `projects/brands/peabuntid/` | Google/Amazon DNA | KB-01 |
| `projects/ego_era/` | Apple DNA | KB-02 |
| `projects/trading/` | Google/Amazon DNA | KB-03 |
| `projects/music/` | — | — |

### Outputs (`outputs/`)
Finished deliverables without a specific project home.

### App (`app/`)
Module 4 — Next.js UI control panel (web dashboard + CLI).

---

## Twin Pillar Rule
- `English/` — operational backend (Jeff reads/writes). Token-efficient English.
- `Thai/` — read-only human mirror. All Thai reporting files. Auto-mirrored from English.

---

## Key Protocols
- **HITL:** Trade > 1% risk | publishing | system config → requires Prem `Approved`
- **Kill switch:** `coprem.killswitch()` → halts all automation
- **Staging before Production:** 10 test cases, score > 4.5 required
- **90-day Memory Audit:** KB-05 decisions older than 90 days flagged for review
