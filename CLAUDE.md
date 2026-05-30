# Jeff | COPREM OS v3.1

## Route
- JOB → `03-system/job/` | PERSONAL → `01-projects/` | CREATIVE → `01-projects/ego-era/`

## Rules
- English internal. Thai reports. HITL: trade >1% | publish | config change.
- Apple=Quality>Speed. Google/Amazon=Math>Flair. Max 1% trade, 10% DD.

## Paths
- Projects: `01-projects/` | KB: `02-knowledge/` | System: `03-system/` | Out: `04-outputs/`
- Navigation: `INDEX.md` | Blueprint: `COPREM_OS_Master_Blueprint_v8.2.md`

## Efficiency Rules (token saving)
- NEVER read whole files — use `grep` or `head -n 30` first
- NEVER re-read a file already in context
- Read only the section needed, use `offset`+`limit`
- Prefer `Bash(grep)` over `Read` for search tasks
- Max file reads per session: 10

## Reading Rules (Token Saving)
- STATUS.md = session start only (already in context via hook)
- Blueprint = NEVER read full — use `grep -n "keyword"` or `tail -30` for Build Log only
- If need spec detail: grep the section header, then `Read` with offset+limit
- Never read Blueprint to answer general questions — use STATUS.md + memory

## Execution Rules (CRITICAL)
- NO INLINE SCRIPTING: Never use `python3 -c`, `cat << EOF`, or huge curl payloads in the terminal.
- FILE-FIRST: If a script is needed, write it to `/scripts/temp.py`, run it, and delete it.
- NO API HACKING: Do not extract local n8n cookies. For complex n8n updates, generate `.json` export files for Prem to import manually via UI.
