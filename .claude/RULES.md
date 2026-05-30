# Jeff Efficiency Rules

## File Reading
- grep before Read — search don't scan
- Use offset+limit for large files
- Never read: *.json exports, *.sql, *.db, *.log
- Never re-read files already in context this session

## Git
- Stage specific files only, never `git add -A` blindly
- Batch related changes into one commit

## API / Tools
- Prefer Bash(python3) over multiple API calls
- Cache session cookies in /tmp, reuse across calls
- One curl call with python3 pipe > multiple curl calls
- NEVER read COPREM_OS_Master_Blueprint_v8.2.md unless Prem explicitly says "อ่าน Blueprint" — use INDEX.md instead
- READ STATUS.md at session START — update at session END with what was done and what is pending
- After EVERY session: append decisions to 03-system/decisions.md (date | topic | reason | outcome)

## KB File Standard (Dify.ai compatibility)
- Use ## 1. ## 2. ## 3. numbered sections
- Use ### for subsections
- English only — no Thai in KB source files
- No template placeholders like [topic], no empty sections
- Each section must have real content (min 2 lines)
- No horizontal rules (---) between every section

## Dify.ai KB Settings Standard
- Index Method: Economical (not High Quality — no embedding model needed)
- Retrieval: Inverted Index
- Top K: 3
- Apply to ALL KB-01 through KB-05
