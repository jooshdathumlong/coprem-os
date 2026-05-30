## SECTION Overview
# SRE Master Playbook — COPREM OS
# Rules 16–25 (Advanced Tactical)
# Load when: complex DB ops, external API calls, server debugging

---

## SECTION Rule 16 — Data Pagination
Never use `SELECT * FROM table` without a row limit.
Always use `LIMIT` + `OFFSET` to prevent DB Out-of-Memory.
```sql
SELECT * FROM inbox_log ORDER BY created_at DESC LIMIT 100 OFFSET 0;
```

---

## SECTION Rule 17 — Input Sanitization
Never interpolate raw Telegram/Webhook input directly into SQL or Bash.
Always use parameterized queries or escape user input first.
```python
cur.execute("INSERT INTO users (name) VALUES (%s)", (user_input,))
```
Risk: SQL Injection. Mitigation: parameterized query — no string concatenation.

---

## SECTION Rule 18 — Dependency Pinning
Never `npm install package` without a pinned version.
Always specify exact version to prevent overnight breakage.
```bash
npm install axios@1.6.0
pip install requests==2.31.0
```

---

## SECTION Rule 19 — Graceful Degradation
If an external API (Telegram, Gemini, Dify) fails, do NOT crash the main process.
Wrap in try/except, log the error, continue. System must stay alive.
```python
try:
    response = call_dify(message)
except Exception as e:
    log_error(e)
    response = {"text": "Service temporarily unavailable"}
```

---

## SECTION Rule 20 — Zero Hardcoded Paths
Never hardcode `/Users/eilinaire/Desktop/...` in any script.
Use relative paths or environment variables.
```python
import os
BASE = os.environ.get("COPREM_BASE", ".")
path = os.path.join(BASE, "03-system/database/init.sql")
```

---

## SECTION Rule 21 — Self-Healing Ports
If Docker port conflicts on startup, diagnose and resolve before re-running.
```bash
lsof -ti :5678 | xargs kill -9 2>/dev/null || true
docker compose up -d
```
Always check before killing — confirm the process is the expected one.

---

## SECTION Rule 22 — Phantom Process Kill
Any background task must have its PID recorded at launch.
```bash
python3 scripts/worker.py & echo $! > /tmp/coprem_worker.pid
# On cleanup:
kill $(cat /tmp/coprem_worker.pid) 2>/dev/null && rm /tmp/coprem_worker.pid
```

---

## SECTION Rule 23 — Idempotent Retries
On retry, ensure re-execution does not duplicate data.
Use UUID or idempotency key to deduplicate.
```sql
INSERT INTO inbox_log (msg_hash, ...) VALUES (...)
ON CONFLICT (msg_hash) DO NOTHING;
```

---

## SECTION Rule 24 — Assume Malice (Zero Trust)
Never expose a Webhook or API endpoint without authentication.
Always validate Secret Token or verify source IP/header.
```python
if request.headers.get("X-Coprem-Secret") != os.environ["WEBHOOK_SECRET"]:
    return {"error": "Unauthorized"}, 401
```

---

## SECTION Rule 25 — Documentation as Code
Every new DB column must have an inline SQL comment on creation.
```sql
ALTER TABLE inbox_log ADD COLUMN lang_detected TEXT; -- ISO 639-1 code: 'th', 'en'
```
Future AI agents must be able to understand schema without external docs.
