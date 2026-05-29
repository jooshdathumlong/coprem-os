# Blueprint: Background Sync Daemon (`sync_daemon.py`)

## 1. Goal
Offload the AI's manual file translation and master context compilation tasks to a background Python worker. This frees up token limits and execution time for the main agent.

## 2. Dependencies
- `watchdog`: For monitoring file system events.
- `openai` / `anthropic` / `google-genai`: To trigger the LLM API for translation.
- `dotenv`: To load API keys.

## 3. Architecture & Flow

### A. The Watcher
- Initialize a `watchdog.Observer` on the `English/` directory.
- Filter events: Listen only for `on_created` and `on_modified` events on `.md` files.
- Ignore events triggered on `English/system/session_log.md` to prevent infinite loops during active logging.

### B. The Queue (Debouncer)
- File changes can happen in bursts (e.g., when a script writes multiple chunks).
- Use a timer-based debounce queue (e.g., wait 5 seconds after the last edit before triggering the sync).

### C. The Sync Worker
When the debounce timer fires for `English/path/to/file.md`:
1. **Translation Sync:**
   - Read the English content.
   - Send to LLM API with prompt: *"Translate this markdown file to detailed Thai, keeping formatting identical."*
   - Save the translated output to `Thai/path/to/file.md` (creating directories if they don't exist).
2. **Context Compilation:**
   - Execute the concatenation logic (iterating through all `English/**/*.md` files).
   - Overwrite `master_context.md` at the root.

## 4. Error Handling
- If the translation API fails, log the error to `system/scripts/logs/sync_error.log` and retry with exponential backoff.
- The daemon must run persistently (e.g., via `pm2` or a `systemd` service).
