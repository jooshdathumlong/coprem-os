# Blueprint: Model Context Protocol (MCP) Migration

## 1. Goal
Transition the system from brittle shell-execution scripts (`run_command("python sqlite_io.py insert ...")`) to standard Model Context Protocol (MCP) servers. This allows the LLM to understand and trigger tools natively with 100% JSON schema accuracy.

## 2. Servers to Build

### A. Database Server (`mcp-sqlite`)
- **Wrap target:** `sqlite_io.py`
- **MCP Tools to Expose:**
  - `db_query(sql: string)`
  - `db_insert(table: string, data: object)`
  - `db_read(table: string, limit: int)`
- **Behavior:** Standardizes all I/O to the Coprem.db SSOT. Enforces schema validation before insertion.

### B. Obsidian File Server (`mcp-obsidian`)
- **Wrap target:** `obsidian_io.py`
- **MCP Tools to Expose:**
  - `read_dashboard(path: string)`
  - `write_dashboard(path: string, content: string)`
- **Behavior:** Restricts modifications to read-only dashboard updates, since the true state lives in SQLite.

### C. Cloud Integration Server (`mcp-cloud`)
- **Wrap target:** `google_apps_trigger.py`, `social_broadcast.py`, `line_oa_broadcast.py`
- **MCP Tools to Expose:**
  - `google_drive_upload(...)`
  - `social_post(platform: string, content: string)`
  - `line_broadcast(message: string)`
- **Behavior:** Gatekeeps external actions. Can be configured in the MCP server to require a physical HITL prompt on the user's terminal before executing the actual API call.

## 3. Implementation Steps
1. Initialize an MCP Python SDK project for each server (using `mcp` pip package).
2. Migrate the core logic of the existing scripts into the tool execution handlers (`@mcp.tool()`).
3. Define strict JSON schemas for arguments to prevent LLM hallucination.
4. Update the Coprem IDE's `mcp.json` config to automatically spawn these servers via `stdio` on startup.
5. Deprecate and delete the raw Python scripts from `system/scripts/`.
