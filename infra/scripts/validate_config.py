#!/usr/bin/env python3
"""
validate_config.py — COPREM config consistency checker.
Checks: required .env keys, Ollama models pulled, n8n reachable.
Run at session start via health_check.sh or standalone.
Exits 0 = all OK | 1 = issues found.
"""

import json, os, subprocess, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).parent.parent
ENV_FILE = ROOT / ".env"

PASS, FAIL = 0, 0

def ok(msg):   global PASS; PASS += 1; print(f"  OK   {msg}")
def fail(msg): global FAIL; FAIL += 1; print(f"  FAIL {msg}")

def load_env():
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env

REQUIRED_KEYS = [
    "POSTGRES_PASSWORD", "LITELLM_MASTER_KEY", "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID", "N8N_API_KEY", "EILINAIRE_GOOGLE_API_KEY",
    "GROQ_API_KEY", "N8N_ENCRYPTION_KEY",
]

REQUIRED_OLLAMA_MODELS = ["qwen2.5:3b", "nomic-embed-text"]

def check_env_keys(env):
    print("\n[ 1 ] Required .env keys")
    for k in REQUIRED_KEYS:
        v = env.get(k, "")
        if v:
            masked = v[:3] + "***" + v[-3:] if len(v) > 6 else "***"
            ok(f"{k} = {masked}")
        else:
            fail(f"{k} MISSING or empty")

def check_ollama(env):
    print("\n[ 2 ] Ollama models")
    try:
        with urllib.request.urlopen("http://localhost:11434/api/tags", timeout=5) as r:
            data = json.loads(r.read())
        pulled = [m["name"].split(":")[0] + ":" + m["name"].split(":")[1]
                  if ":" in m["name"] else m["name"]
                  for m in data.get("models", [])]
        for model in REQUIRED_OLLAMA_MODELS:
            if any(model in p for p in pulled):
                ok(f"{model} pulled")
            else:
                fail(f"{model} NOT pulled — run: ollama pull {model}")
    except Exception as e:
        fail(f"Ollama unreachable: {e}")

def check_n8n(env):
    print("\n[ 3 ] n8n API")
    try:
        req = urllib.request.Request("http://localhost:5678/api/v1/workflows?limit=1",
            headers={"X-N8N-API-KEY": env.get("N8N_API_KEY", "")})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
        count = len(data.get("data", []))
        ok(f"n8n API reachable — {count} workflow(s) returned")
    except Exception as e:
        fail(f"n8n API error: {e}")

def check_litellm(env):
    print("\n[ 4 ] LiteLLM proxy")
    key = env.get("LITELLM_MASTER_KEY", "")
    try:
        req = urllib.request.Request("http://localhost:4000/v1/models",
            headers={"Authorization": f"Bearer {key}"})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
        models = [m["id"] for m in data.get("data", [])]
        ok(f"LiteLLM reachable — {len(models)} model(s) configured")
    except Exception as e:
        fail(f"LiteLLM error: {e}")

def check_postgres(env):
    print("\n[ 5 ] Postgres tables")
    cid_result = subprocess.run(
        ["docker", "ps", "--filter", "label=coprem.service=postgres", "-q"],
        capture_output=True, text=True)
    cid = cid_result.stdout.strip().split("\n")[0]
    if not cid:
        cid_result2 = subprocess.run(
            ["docker", "ps", "--filter", "name=postgres", "-q"],
            capture_output=True, text=True)
        cid = cid_result2.stdout.strip().split("\n")[0]
    if not cid:
        fail("Postgres container not found"); return

    required_tables = ["users", "inbox_log", "audit_log", "memory_embeddings", "agent_tasks"]
    for table in required_tables:
        result = subprocess.run(
            ["docker", "exec", cid, "psql", "-U", "coprem", "-d", "coprem_os", "-t", "-c",
             f"SELECT 1 FROM information_schema.tables WHERE table_name='{table}';"],
            capture_output=True, text=True)
        if "1" in result.stdout:
            ok(f"table {table} exists")
        else:
            fail(f"table {table} MISSING — run migrations")

def main():
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(" COPREM Config Validation")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    env = load_env()
    check_env_keys(env)
    check_ollama(env)
    check_n8n(env)
    check_litellm(env)
    check_postgres(env)

    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    total = PASS + FAIL
    if FAIL == 0:
        print(f" ALL {total} CHECKS PASSED")
    else:
        print(f" {FAIL} FAILED / {total} checks ({PASS} passed)")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    sys.exit(0 if FAIL == 0 else 1)

if __name__ == "__main__":
    main()
