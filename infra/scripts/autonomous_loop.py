#!/usr/bin/env python3
"""
autonomous_loop.py — COPREM OS Autonomous Agent Loop
Phase 4 | v1.0

Polls task_queue every 3s, routes tasks to the correct handler,
chains next tasks automatically. No human trigger required.

Run:
  nohup python3 scripts/autonomous_loop.py >> logs/autonomous_loop.log 2>&1 &
  echo $! > logs/autonomous_loop.pid
"""

import os, sys, time, json, signal, logging, subprocess, threading
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler
import psycopg2
import psycopg2.extras
import requests

# ── Config ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parents[1]
LOG_DIR = ROOT / "03-system" / "logs"
LOG_DIR.mkdir(exist_ok=True)
PID_FILE = LOG_DIR / "autonomous_loop.pid"

_log_file = LOG_DIR / "autonomous_loop.log"
_rot_handler = RotatingFileHandler(_log_file, maxBytes=5*1024*1024, backupCount=3)
_rot_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout), _rot_handler],
)
log = logging.getLogger("coprem.loop")

TASK_TIMEOUT = 120  # seconds — max time allowed per task before forced failure

POLL_INTERVAL = 3  # seconds

# ── Env ───────────────────────────────────────────────────────────────────────
def load_env():
    env_file = ROOT / ".env"
    env = {}
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env

ENV = load_env()

POSTGRES_PASSWORD = ENV.get("POSTGRES_PASSWORD", "")
LITELLM_KEY = ENV.get("LITELLM_MASTER_KEY", "")
TELEGRAM_TOKEN = ENV.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = ENV.get("TELEGRAM_CHAT_ID", "")
N8N_BASE = ENV.get("N8N_BASE_URL", "http://localhost:5678")
N8N_KEY = ENV.get("N8N_API_KEY", "")

LITELLM_URL = "http://localhost:4000"

# ── DB ────────────────────────────────────────────────────────────────────────
def get_pg_container():
    try:
        out = subprocess.check_output(
            ["docker", "ps", "--filter", "name=postgres", "-q"],
            encoding="utf-8", stderr=subprocess.DEVNULL
        ).strip().split("\n")
        return out[0] if out else None
    except Exception:
        return None

def pg_exec(sql: str) -> str:
    cid = get_pg_container()
    if not cid:
        raise RuntimeError("Postgres container not found")
    cmd = ["docker", "exec", cid, "psql", "-U", "coprem", "-d", "coprem_os", "-t", "-A", "-F", "|||", "-c", sql]
    return subprocess.check_output(cmd, encoding="utf-8", stderr=subprocess.DEVNULL).strip()

def fetch_pending_tasks() -> list[dict]:
    """Fetch up to 5 pending tasks ordered by priority asc (1=highest), run_at."""
    sql = """
SELECT id::text, type, payload::text, status, priority, assigned_to, next_agent, retries, max_retries
FROM task_queue
WHERE status = 'pending' AND run_at <= NOW()
ORDER BY priority ASC, run_at ASC
LIMIT 5;
"""
    raw = pg_exec(sql)
    if not raw:
        return []
    tasks = []
    for line in raw.splitlines():
        parts = line.split("|||")
        if len(parts) < 9:
            continue
        try:
            payload = json.loads(parts[2]) if parts[2] and parts[2] != "" else {}
        except Exception:
            payload = {}
        tasks.append({
            "id": parts[0],
            "type": parts[1],
            "payload": payload,
            "status": parts[3],
            "priority": int(parts[4]) if parts[4] else 5,
            "assigned_to": parts[5] or "jeff",
            "next_agent": parts[6] or "",
            "retries": int(parts[7]) if parts[7] else 0,
            "max_retries": int(parts[8]) if parts[8] else 3,
        })
    return tasks

def _esc(s: str) -> str:
    """Escape single quotes for psql literal strings."""
    return str(s).replace("'", "''")

def mark_running(task_id: str):
    pg_exec(f"UPDATE task_queue SET status='running', started_at=NOW() WHERE id='{_esc(task_id)}';")

def mark_done(task_id: str, result: str):
    safe = _esc(result)[:2000]
    pg_exec(f"UPDATE task_queue SET status='done', result='{safe}', completed_at=NOW() WHERE id='{_esc(task_id)}';")

def mark_failed(task_id: str, error: str):
    safe = _esc(error)[:500]
    pg_exec(f"UPDATE task_queue SET status='failed', error='{safe}', completed_at=NOW() WHERE id='{_esc(task_id)}';")

def retry_task(task_id: str, retries: int, error: str):
    safe = _esc(error)[:500]
    delays = [15, 60, 300]
    delay = delays[min(retries, len(delays) - 1)]
    pg_exec(f"""
UPDATE task_queue
SET status='pending', retries={retries+1}, error='{safe}', run_at=NOW() + INTERVAL '{delay} seconds'
WHERE id='{_esc(task_id)}';
""")

def create_task(type_: str, payload: dict, assigned_to: str, priority: int = 5, delay_seconds: int = 0):
    safe_payload = _esc(json.dumps(payload))
    safe_type = _esc(type_)
    safe_agent = _esc(assigned_to)
    pg_exec(f"""
INSERT INTO task_queue (type, payload, assigned_to, priority, run_at)
VALUES ('{safe_type}', '{safe_payload}', '{safe_agent}', {int(priority)}, NOW() + INTERVAL '{int(delay_seconds)} seconds');
""")

# ── Telegram ──────────────────────────────────────────────────────────────────
def telegram_notify(text: str):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": f"[COPREM Auto] {text}", "parse_mode": "Markdown"},
            timeout=5,
        )
    except Exception:
        pass

# ── LiteLLM ───────────────────────────────────────────────────────────────────
JEFF_SYSTEM = """You are Jeff, AI Executive Partner. Answer in Thai. Be direct and concise.
Rules: Answer the question directly. No roleplay. No repeating the question. Max 3 sentences unless task requires more."""

EILINAIRE_SYSTEM = """You are Eilinaire, PERSONAL pillar agent for COPREM OS.
You handle personal brand strategy, trading, and wealth planning.
Running in autonomous mode. Respond in Thai, be concise and actionable."""

AGENT_PROMPTS = {
    "jeff": JEFF_SYSTEM,
    "eilinaire": EILINAIRE_SYSTEM,
    "router": JEFF_SYSTEM,
}

TIER_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "groq/llama-3.3-70b",
    "ollama/qwen2.5:3b",
]

def call_litellm(prompt: str, agent: str = "jeff", model: str = "auto") -> str:
    """Call LiteLLM with tier fallback. model='auto' tries all tiers."""
    system = AGENT_PROMPTS.get(agent, JEFF_SYSTEM)
    if model == "auto":
        models_to_try = TIER_MODELS
    else:
        models_to_try = [model] + [m for m in TIER_MODELS if m != model]

    last_err = ""
    for m in models_to_try:
        try:
            resp = requests.post(
                f"{LITELLM_URL}/chat/completions",
                headers={"Authorization": f"Bearer {LITELLM_KEY}", "Content-Type": "application/json"},
                json={
                    "model": m,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 800,
                    "temperature": 0.3,
                },
                timeout=30,
            )
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", 3))
                log.warning(f"  429 on {m} — waiting {wait}s then trying next tier")
                time.sleep(wait)
                last_err = f"429 on {m}"
                continue
            resp.raise_for_status()
            body = resp.json()
            choices = body.get("choices") or []
            if not choices:
                raise RuntimeError(f"LiteLLM returned no choices: {str(body)[:200]}")
            content = (choices[0].get("message") or {}).get("content", "").strip()
            if m != (TIER_MODELS[0] if model == "auto" else model):
                log.info(f"  (fell back to {m})")
            return content
        except requests.exceptions.HTTPError as e:
            last_err = str(e)
            log.warning(f"  HTTPError on {m}: {last_err[:80]} — trying next tier")
        except Exception as e:
            last_err = str(e)
            log.warning(f"  Error on {m}: {last_err[:80]} — trying next tier")

    raise RuntimeError(f"All LiteLLM tiers exhausted. Last error: {last_err}")

# ── n8n ───────────────────────────────────────────────────────────────────────
def call_n8n_webhook(path: str, payload: dict) -> str:
    url = f"{N8N_BASE}/webhook/{path}"
    resp = requests.post(url, json=payload, timeout=15)
    resp.raise_for_status()
    return resp.text[:500]

# ── Handlers ─────────────────────────────────────────────────────────────────
def handle_chat(task: dict) -> str:
    """Route chat-type task through n8n WF01 webhook."""
    payload = task["payload"]
    message = payload.get("message", payload.get("prompt", ""))
    chat_id = payload.get("chat_id", TELEGRAM_CHAT_ID)
    result = call_n8n_webhook("telegram-coprem", {
        "message": {"text": message, "chat": {"id": chat_id}, "from": {"id": chat_id}},
        "source": "autonomous_loop",
    })
    return result

def handle_analysis(task: dict) -> str:
    """Run analysis task via LiteLLM."""
    payload = task["payload"]
    prompt = payload.get("prompt", "Analyze current system state.")
    agent = task.get("assigned_to", "jeff")
    model = payload.get("model", "auto")
    result = call_litellm(prompt, agent=agent, model=model)

    # Notify via Telegram if requested
    if payload.get("notify_telegram", False):
        telegram_notify(f"*Analysis done by {agent}:*\n{result[:600]}")

    # If payload specifies a chain: create next task
    next_task = payload.get("chain_next")
    if next_task:
        create_task(
            type_=next_task.get("type", "analysis"),
            payload={**next_task.get("payload", {}), "context": result[:500]},
            assigned_to=next_task.get("assigned_to", agent),
            priority=next_task.get("priority", 5),
            delay_seconds=next_task.get("delay_seconds", 0),
        )
        log.info(f"  → Chained next task: {next_task.get('type')} for {next_task.get('assigned_to')}")

    return result

def handle_agent_handoff(task: dict) -> str:
    """Hand off work to another agent by creating a new task."""
    payload = task["payload"]
    next_agent = task.get("next_agent") or payload.get("next_agent", "eilinaire")
    handoff_prompt = payload.get("prompt", payload.get("message", "Continue previous task."))
    context = payload.get("context", "")

    create_task(
        type_="analysis",
        payload={
            "prompt": handoff_prompt,
            "context": context,
            "notify_telegram": True,
        },
        assigned_to=next_agent,
        priority=task.get("priority", 5),
        delay_seconds=0,
    )
    return f"Handed off to {next_agent}: {handoff_prompt[:100]}"

def handle_report(task: dict) -> str:
    """Generate a report and send via Telegram."""
    payload = task["payload"]
    prompt = payload.get("prompt", "Generate daily status report.")
    result = call_litellm(prompt, agent=task.get("assigned_to", "jeff"))
    telegram_notify(result[:1000])
    return result

def handle_kb_embed(task: dict) -> str:
    """Trigger KB re-embedding."""
    result = subprocess.check_output(
        ["python3", str(ROOT / "scripts" / "embed_kb.py")],
        encoding="utf-8", stderr=subprocess.STDOUT,
        cwd=str(ROOT), timeout=120,
    )
    return result[-300:]

HANDLERS = {
    "chat": handle_chat,
    "analysis": handle_analysis,
    "agent_handoff": handle_agent_handoff,
    "report": handle_report,
    "kb_embed": handle_kb_embed,
}

# ── Main Loop ────────────────────────────────────────────────────────────────
def process_task(task: dict):
    task_id = task["id"]
    task_type = task["type"]
    agent = task.get("assigned_to", "jeff")
    log.info(f"[{task_type}] id={task_id[:8]} agent={agent} retries={task['retries']}")

    mark_running(task_id)

    handler = HANDLERS.get(task_type)
    if not handler:
        mark_failed(task_id, f"Unknown task type: {task_type}")
        log.warning(f"  Unknown type: {task_type}")
        return

    LLM_TYPES = {"analysis", "report", "chat"}
    try:
        result_holder: list = []
        exc_holder: list = []
        def _run():
            try:
                result_holder.append(handler(task))
            except Exception as ex:
                exc_holder.append(ex)
        t = threading.Thread(target=_run, daemon=True)
        t.start()
        t.join(timeout=TASK_TIMEOUT)
        if t.is_alive():
            raise RuntimeError(f"Task timed out after {TASK_TIMEOUT}s")
        if exc_holder:
            raise exc_holder[0]
        result = result_holder[0] if result_holder else "OK"
        mark_done(task_id, result or "OK")
        log.info(f"  ✓ done: {str(result)[:80]}")
        if task_type in LLM_TYPES:
            time.sleep(2)
    except Exception as e:
        error = str(e)
        retries = task["retries"]
        max_retries = task["max_retries"]
        if retries < max_retries:
            retry_task(task_id, retries, error)
            log.warning(f"  ✗ retry {retries+1}/{max_retries} (backoff): {error[:100]}")
        else:
            mark_failed(task_id, error)
            telegram_notify(f"⚠️ Task FAILED: [{task_type}] {error[:200]}")
            log.error(f"  ✗ failed permanently: {error[:150]}")

def run_loop():
    log.info("=" * 60)
    log.info("COPREM Autonomous Loop started")
    log.info(f"Polling every {POLL_INTERVAL}s | LiteLLM: {LITELLM_URL}")
    log.info("=" * 60)

    # Write PID
    PID_FILE.write_text(str(os.getpid()))

    shutdown = False
    def on_signal(sig, frame):
        nonlocal shutdown
        log.info("Shutdown signal received — finishing current cycle...")
        shutdown = True

    signal.signal(signal.SIGTERM, on_signal)
    signal.signal(signal.SIGINT, on_signal)
    signal.signal(signal.SIGHUP, on_signal)

    idle_ticks = 0
    webhook_failures = 0
    HEARTBEAT_INTERVAL = 300  # 5 min heartbeat check
    last_heartbeat = 0
    last_morning_briefing = 0  # epoch of last briefing sent

    while not shutdown:
        try:
            tasks = fetch_pending_tasks()
            if tasks:
                idle_ticks = 0
                for task in tasks:
                    if shutdown:
                        break
                    process_task(task)
            else:
                idle_ticks += 1
                if idle_ticks % 20 == 0:
                    log.info("  … idle, queue empty")

            # Daily Morning Briefing — send at 08:00 BKK time, once per day
            now = time.time()
            dt_bkk = datetime.fromtimestamp(now, tz=__import__('zoneinfo').ZoneInfo('Asia/Bangkok'))
            if dt_bkk.hour == 8 and dt_bkk.minute < 5:
                today_epoch = int(datetime(dt_bkk.year, dt_bkk.month, dt_bkk.day).timestamp())
                if last_morning_briefing < today_epoch:
                    last_morning_briefing = today_epoch
                    try:
                        pending = pg_exec("SELECT COUNT(*) FROM agent_tasks WHERE status='pending';").strip()
                        briefing = call_litellm(
                            f"สรุป morning briefing สำหรับ Prem (Marketing Manager Batiste/Scrub Daddy) วันนี้ {dt_bkk.strftime('%A %d %B %Y')}\n"
                            f"งานค้างใน queue: {pending} tasks\n"
                            f"ให้สรุป: 1) งานวันนี้ที่ควรทำก่อน 2) reminder สำคัญ 3) Jeff พร้อมช่วย\n"
                            f"ตอบภาษาไทย กระชับ ≤5 บรรทัด",
                            agent="jeff"
                        )
                        telegram_notify(f"🌅 Good Morning Prem\n\n{briefing}")
                        log.info("Morning briefing sent")
                    except Exception as me:
                        log.warning(f"Morning briefing error: {me}")

            # Webhook heartbeat check every 5 min
            if now - last_heartbeat >= HEARTBEAT_INTERVAL:
                last_heartbeat = now
                try:
                    r = requests.post(
                        f"{N8N_BASE}/webhook/telegram-coprem",
                        json={"source": "heartbeat", "message": {"text": "__ping__", "chat": {"id": 0}, "from": {"id": 0}}},
                        timeout=10
                    )
                    if r.status_code >= 400:
                        webhook_failures += 1
                        if webhook_failures >= 3:
                            log.error(f"⚠️ Webhook failing {webhook_failures}x — check n8n WF01")
                    else:
                        webhook_failures = 0
                except Exception as whe:
                    webhook_failures += 1
                    log.warning(f"Webhook heartbeat fail #{webhook_failures}: {whe}")

        except Exception as e:
            log.error(f"Loop error: {e}")

        time.sleep(POLL_INTERVAL)

    log.info("Autonomous loop stopped cleanly.")
    if PID_FILE.exists():
        PID_FILE.unlink()
    # Exit 0 so launchd KeepAlive:true restarts us on next login
    # (launchd with KeepAlive:true will always restart regardless of exit code)

if __name__ == "__main__":
    run_loop()
