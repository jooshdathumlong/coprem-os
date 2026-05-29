# Master Lean Direct API Blueprint

## 1. Executive Summary
Coprem operates on a "No-Middleman Direct API Architecture" (Lean/OSS), eliminating SaaS middleware. 
Flow: Prem (`Approved`) -> Jeff -> Scripts (`system/scripts/`) -> Local I/O & Cloud APIs.

## 2. Infrastructure
- **`.env.vault`**: Local encrypted tokens (Obsidian path, DB path, GAS URL, LINE/Social keys).
- **SQLite DB (`system/db/Coprem.db`)**: Tracks outputs, tasks, contacts, intel. Visualized via NocoDB.
- **Obsidian**: Direct markdown I/O via `obsidian_io.py`.

## 3. Direct Integration Scripts (`system/scripts/`)
- **`sqlite_io.py`**: Queries/updates local DB (`init`, `read`, `insert`).
- **`obsidian_io.py`**: Local vault disk I/O (`read`, `write`, `list`). Prepends edit timestamps.
- **`google_apps_trigger.py`**: Secure GAS portal for Drive/Gmail/Docs/Calendar via webhooks.
- **`social_broadcast.py`**: Direct OAuth/Graph publishing (FB, IG, X v2, TikTok).
- **`line_oa_broadcast.py`**: LINE Messaging API (Broadcast, Push, Multicast).

## 4. HITL Protocol
1. No autonomous writes/broadcasts.
2. Agents format planned actions in the Executive Summary Report.
3. **Trigger:** Script executes ONLY upon Prem typing `Approved`.

## 5. Connector Matrix
| Connector | Access | Agents | Script |
|---|---|---|---|
| Obsidian | R/W | Archie, Libby, Newy | `obsidian_io.py` |
| SQLite | R/W | Archie, Libby, Newy, Zane, Chloe, Stella, Marco | `sqlite_io.py` |
| GAS | Interactive | Archie, Libby, Newy | `google_apps_trigger.py` |
| LINE/Socials | Broadcast | Zane, Chloe, Stella, Marco | `line_oa_broadcast.py`/`social_broadcast.py` |
| Web Scrapers | R-Only | All | Native calls |
