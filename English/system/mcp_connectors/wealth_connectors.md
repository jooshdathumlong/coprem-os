# Wealth Department MCP Connectors (Master Lean Stack)

## Active Connectors

| Connector | Access | Method |
|---|---|---|
| **Playwright / Firecrawl** | Read-only | Web scraping for macro news, filings, and financial data |
| **Google Sheets (GWorkspace)** | Read&Write | Google Apps Script via `system/scripts/google_apps_trigger.py` |
| **Obsidian (Local)** | Read&Write | `system/scripts/obsidian_io.py` — Local Credit/Strategy notes |
| **SQLite (NocoDB)** | Read&Write | `system/scripts/sqlite_io.py` — Local DB engine |

## HITL Rule
All **Write** operations via Python scripts require explicit "Approved" from Prem.
