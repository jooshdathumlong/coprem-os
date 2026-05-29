# Operations & Knowledge Department MCP Connectors (Master Lean Stack)

## Active Connectors

| Connector | Access | Method |
|---|---|---|
| **Obsidian (Local)** | Read&Write | `system/scripts/obsidian_io.py` — Direct local file I/O |
| **SQLite (NocoDB)** | Read&Write | `system/scripts/sqlite_io.py` — Local DB engine |
| **Notion** | Read&Write | REST API via `MCP_NOTION_KEY` |
| **Google Drive** | Read&Write | Google Apps Script via `system/scripts/google_apps_trigger.py` |
| **Gmail** | Read&Write | Google Apps Script via `system/scripts/google_apps_trigger.py` |
| **Google Calendar** | Read&Write | Google Apps Script via `system/scripts/google_apps_trigger.py` |
| **Playwright / Firecrawl** | Read-only | Web scraping for news and intel |

## HITL Rule
All **Write** operations via Python scripts require explicit "Approved" from เปรม.
