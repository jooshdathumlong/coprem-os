# Creative Arts Department MCP Connectors (Master Lean Stack)

## Active Connectors

| Connector | Access | Method |
|---|---|---|
| **Playwright / Firecrawl** | Read-only | Web scraping for design/lore research and competitive analysis |
| **Notion / Google Docs** | Read&Write | REST API / Google Apps Script via `system/scripts/google_apps_trigger.py` |
| **Obsidian (Local)** | Read&Write | `system/scripts/obsidian_io.py` — Local lore/character vault database |
| **SQLite (NocoDB)** | Read&Write | `system/scripts/sqlite_io.py` — Local DB engine |

## HITL Rule
All **Write** operations via Python scripts require explicit "Approved" from เปรม.
