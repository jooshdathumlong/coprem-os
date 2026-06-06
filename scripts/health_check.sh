#!/bin/bash
# health_check.sh — Run at session start and end.
# Auto-detects and fixes common issues (credential drift, zombie containers, webhook).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV="$ROOT/.env"

echo "## SYSTEM_STATE — $(date '+%Y-%m-%d %H:%M')" > /tmp/state.md

# ── Config validation (fast check) ───────────────────────────
python3 "$SCRIPT_DIR/validate_config.py" > /tmp/validate_out.txt 2>&1
if grep -q "FAIL" /tmp/validate_out.txt; then
  echo "| Config validation | FAIL | $(grep FAIL /tmp/validate_out.txt | head -1) |" >> /tmp/state.md
else
  echo "| Config validation | OK |" >> /tmp/state.md
fi

# ── Infrastructure checks ─────────────────────────────────────
check() {
  local name=$1 cmd=$2 note=$3
  eval "$cmd" > /dev/null 2>&1
  status=$([[ $? -eq 0 ]] && echo "UP" || echo "DOWN")
  echo "| $name | $status | ${note} |" >> /tmp/state.md
}

check "n8n"      "curl -sf --max-time 5 http://localhost:5678/healthz"
PG_CID=$(docker ps --filter label=coprem.service=postgres -q 2>/dev/null | head -1)
REDIS_CID=$(docker ps --filter label=coprem.service=redis -q 2>/dev/null | head -1)
# fallback: name-based if labels not yet applied
[ -z "$PG_CID" ] && PG_CID=$(docker ps --filter name=postgres -q 2>/dev/null | head -1)
[ -z "$REDIS_CID" ] && REDIS_CID=$(docker ps --filter name=redis -q 2>/dev/null | head -1)
check "postgres" "docker exec $PG_CID pg_isready -U coprem -d coprem_os -q"
check "redis"    "docker exec $REDIS_CID redis-cli ping" "PONG"
LITELLM_KEY=$(grep "^LITELLM_MASTER_KEY=" "$ENV" | cut -d= -f2)
check "litellm"  "curl -sf --max-time 5 -H 'Authorization: Bearer $LITELLM_KEY' http://localhost:4000/v1/models" "port 4000"
check "dify"     "curl -sL --max-time 5 -o /dev/null -w '%{http_code}' https://cloud.dify.ai | grep -q 200"

# Postgres auth
PG_PASS=$(grep "^POSTGRES_PASSWORD=" "$ENV" | cut -d= -f2)
docker exec $PG_CID psql -U coprem -d coprem_os \
  -c "SELECT 1" -q > /dev/null 2>&1 \
  && echo "| Postgres auth | OK |" >> /tmp/state.md \
  || echo "| Postgres auth | FAIL |" >> /tmp/state.md

# ── Auto-fix: Credential drift ────────────────────────────────
N8N_UP=$(curl -sf --max-time 3 http://localhost:5678/healthz 2>/dev/null && echo "yes" || echo "no")
if [[ "$N8N_UP" == "yes" ]]; then
  # Test if Postgres credential works by checking a recent execution
  CRED_OK=$(docker exec $PG_CID psql -U coprem -d coprem_os -t -c \
    "SELECT COUNT(*) FROM credentials_entity WHERE id = '226PbeVgki0neEi4';" 2>/dev/null | tr -d ' ')
  if [[ "$CRED_OK" == "1" ]]; then
    # Always sync credentials on health check (idempotent, safe)
    python3 "$SCRIPT_DIR/fix_credentials.py" > /dev/null 2>&1 \
      && echo "| Credential sync | OK |" >> /tmp/state.md \
      || echo "| Credential sync | FAIL |" >> /tmp/state.md
  fi
fi

# ── Auto-fix: Zombie containers ───────────────────────────────
ZOMBIE=$(docker ps --format "{{.Names}}" 2>/dev/null | grep "^coprem-cloudflared")
if [ -n "$ZOMBIE" ]; then
  docker stop "$ZOMBIE" > /dev/null 2>&1
  echo "| Zombie containers | STOPPED | $ZOMBIE |" >> /tmp/state.md
fi

# ── Auto-fix: WEBHOOK_URL check ───────────────────────────────
N8N_CID=$(docker ps --filter label=coprem.service=n8n -q 2>/dev/null | head -1)
[ -z "$N8N_CID" ] && N8N_CID=$(docker ps --filter name=n8n -q 2>/dev/null | head -1)
WH_URL=$(docker exec $N8N_CID printenv WEBHOOK_URL 2>/dev/null)
if [[ "$WH_URL" == *"localhost"* ]]; then
  echo "| WEBHOOK_URL | WRONG | was localhost — restart needed |" >> /tmp/state.md
else
  echo "| WEBHOOK_URL | OK | $WH_URL |" >> /tmp/state.md
fi

# ── Telegram webhook ──────────────────────────────────────────
EXPECTED_WH_PATH="telegram-coprem"
BOT_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" "$ENV" | cut -d= -f2)
TG_WH_INFO=$(curl -s --max-time 5 "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" 2>/dev/null)
TG_WH_URL=$(echo "$TG_WH_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'].get('url',''))" 2>/dev/null)
TG_WH_ERR=$(echo "$TG_WH_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'].get('last_error_message',''))" 2>/dev/null)

# Always force-reset to production URL — prevents n8n test mode from overwriting
FIX_RESULT=$(curl -s --max-time 5 "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=https://n8n.peabuntid.com/webhook/$EXPECTED_WH_PATH" \
  -d "allowed_updates=[\"message\"]" 2>/dev/null | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if d.get('ok') else 'FAIL')" 2>/dev/null)
if [[ "$TG_WH_URL" == *"$EXPECTED_WH_PATH"* ]]; then
  echo "| Telegram webhook | OK | $TG_WH_URL |" >> /tmp/state.md
else
  echo "| Telegram webhook | FIXED | was: $TG_WH_URL → reset to $EXPECTED_WH_PATH ($FIX_RESULT) |" >> /tmp/state.md
fi

# ── Autonomous loop PID check ─────────────────────────────────
PID_FILE="$ROOT/03-system/logs/autonomous_loop.pid"
if [ -f "$PID_FILE" ]; then
  LOOP_PID=$(cat "$PID_FILE")
  if kill -0 "$LOOP_PID" 2>/dev/null; then
    echo "| Autonomous Loop | UP | PID $LOOP_PID (03-system/logs/autonomous_loop.pid) |" >> /tmp/state.md
  else
    echo "| Autonomous Loop | DOWN | PID $LOOP_PID dead — restart with post_restart.sh |" >> /tmp/state.md
  fi
else
  echo "| Autonomous Loop | UNKNOWN | no PID file |" >> /tmp/state.md
fi

# ── Dashboard check ───────────────────────────────────────────
if lsof -i :3001 -sTCP:LISTEN -t > /dev/null 2>&1; then
  echo "| Dashboard | UP | port 3001 |" >> /tmp/state.md
else
  echo "| Dashboard | DOWN | run post_restart.sh to start |" >> /tmp/state.md
fi

# ── WF01 Integrity Check: detect duplicate node inputs ────────
N8N_API_KEY=$(grep "^N8N_API_KEY=" "$ENV" | cut -d= -f2)
WF01_ID="fOD1CntyrmRExZpO"
WF01_CHECK=$(curl -s --max-time 5 \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "http://localhost:5678/api/v1/workflows/$WF01_ID" 2>/dev/null | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  conns=d.get('connections',{})
  # Count how many nodes connect to L3 Inject Context
  inject_inputs=0
  for src,outs in conns.items():
    for lst in outs.get('main',[]):
      for c in lst:
        if c.get('node')=='L3 Inject Context': inject_inputs+=1
  if inject_inputs>1: print(f'WARN:L3 Inject Context has {inject_inputs} inputs — duplicate reply risk')
  else: print('OK')
except: print('SKIP')
" 2>/dev/null)
echo "| WF01 integrity | ${WF01_CHECK:-SKIP} |" >> /tmp/state.md

# ── Git remote safety check ────────────────────────────────────
GIT_REMOTE=$(git -C "$ROOT" remote get-url origin 2>/dev/null || echo "")
if [[ "$GIT_REMOTE" == *"@"* ]] || [[ "$GIT_REMOTE" == *"ghp_"* ]]; then
  echo "| Git remote | UNSAFE | token/credentials in URL — run: git remote set-url origin https://github.com/jooshdathumlong/coprem-os.git |" >> /tmp/state.md
else
  echo "| Git remote | OK | $GIT_REMOTE |" >> /tmp/state.md
fi

# ── Write to SYSTEM_STATE.md ──────────────────────────────────
cp /tmp/state.md "$ROOT/SYSTEM_STATE.md"

cat /tmp/state.md
