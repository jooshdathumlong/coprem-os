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
