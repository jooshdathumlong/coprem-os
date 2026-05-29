# Business & Marketing Department MCP Connectors (Master Lean Stack)

## Active Connectors

| Connector | Access | Method |
|---|---|---|
| **Canva** | Read&Write | REST API via `MCP_CANVA_KEY` |
| **Notion** | Read&Write | REST API via `MCP_NOTION_KEY` |
| **Google Workspace** | Read&Write | Google Apps Script via `system/scripts/google_apps_trigger.py` |
| **SQLite (NocoDB)** | Read&Write | `system/scripts/sqlite_io.py` — For contact/lead tracking |
| **Facebook Graph API** | Read&Write | `system/scripts/social_broadcast.py` — Direct Page posting |
| **Instagram Graph API** | Read&Write | `system/scripts/social_broadcast.py` — Direct media posting |
| **X (Twitter) API v2** | Read&Write | `system/scripts/social_broadcast.py` — Direct tweet posting |
| **TikTok Creator API** | Read&Write | `system/scripts/social_broadcast.py` — Direct video upload |
| **LINE OA Messaging API** | Read&Write | `system/scripts/line_oa_broadcast.py` — Push/Broadcast |
| **Playwright / Firecrawl** | Read-only | Competitor scraping and market intel |

## HITL Rule
All **broadcast/publish** operations require explicit "Approved" from เปรม.
No automated posting without executive sign-off.
