# COPREM OS — Index (Map of Content)

> Version: 3.1.0 | Updated: 2026-05-31 | Structure: PARA

## Navigation

### 01-projects/ — Active Work
| Folder | Project | Status |
|--------|---------|--------|
| `eilinaire/` | Brand — Decision System ("Less choice. More clarity") | Active |
| `peabuntid/` | Brand — Trusted Curator Platform (TH) | Active |
| `ego-era/` | Fantasy Novel — EGO ERA | Active |
| `trading/` | The5ers Derivatives + Mutual Funds | Research |
| `music/` | Songwriter & Artist | Sandbox |

### 02-knowledge/ — Knowledge Base
| Folder | Content | Dify KB |
|--------|---------|---------|
| `brand/` | Eilinaire + Peabuntid SSOTs | KB-01 |
| `ego-era/` | Lore rules + style reference | KB-02 |
| `trading/` | Investment research | KB-03 |
| `job/` | Marketing + Ops dept knowledge | KB-04 |
| `personal/` | Mindset, learning, me SSOT | — |

### 03-system/ — COPREM OS Operational
| Folder | Content |
|--------|---------|
| `agents/` | System prompts: Jeff, Eilinaire, Ego Era, Smart Router |
| `workflows/specs/` | n8n Workflow 01–11 specifications |
| `workflows/exports/` | n8n JSON exports (importable) |
| `database/schemas/` | Supabase SQL schemas (6 tables) |
| `scripts/` | start_coprem.sh, register_telegram_webhook.sh |
| `skills/` | Agent playbooks |
| `job/` | dept_marketing.md, dept_ops.md |
| `personal/` | personal_matrix.md, grace.md |
| `security/` | webhook_validation.md |
| `monitoring/` | dashboard.md |
| `knowledge-base/` | kb_index.md (KB-01→05 mapping) |

### 04-outputs/ — Deliverables
Finished work without a specific project home.

### app/ — Module 4 UI
Next.js dashboard (localhost:3000)

### scripts/ — Core Scripts
Canonical Python scripts serving both vaults.

---

## Key Files
- `CLAUDE.md` — Jeff brain (routing + rules)
- `prem-profile.md` — Prem master profile (English)
- `prem-profile-th.md` — Prem master profile (Thai)
- `COPREM_OS_Master_Blueprint_v8.2.md` — Full system spec
- `CHANGELOG.md` — Version history

## Quick Start
```bash
# Start COPREM daily
export TELEGRAM_BOT_TOKEN=your_token
./03-system/scripts/start_coprem.sh
```
