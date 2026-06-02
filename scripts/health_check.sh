#!/bin/bash
# health_check.sh — Run at session start and end.
# Auto-detects and fixes common issues (credential drift, zombie containers, webhook).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV="$ROOT/.env"

echo "## SYSTEM_STATE — $(date '+%Y-%m-%d %H:%M')" > /tmp/state.md

# ── Infrastructure checks ─────────────────────────────────────
check() {
  local name=$1 cmd=$2 note=$3
  eval "$cmd" > /dev/null 2>&1
  status=$([[ $? -eq 0 ]] && echo "UP" || echo "DOWN")
  echo "| $name | $status | ${note} |" >> /tmp/state.md
}

check "n8n"      "curl -sf --max-time 5 http://localhost:5678/healthz"
check "postgres" "docker exec 03-system-postgres-1 pg_isready -U coprem -d coprem_os -q"
check "redis"    "docker exec 03-system-redis-1 redis-cli ping" "PONG"
LITELLM_KEY=$(grep "^LITELLM_MASTER_KEY=" "$ENV" | cut -d= -f2)
check "litellm"  "curl -sf --max-time 5 -H 'Authorization: Bearer $LITELLM_KEY' http://localhost:4000/v1/models" "port 4000"
check "dify"     "curl -sL --max-time 5 -o /dev/null -w '%{http_code}' https://cloud.dify.ai | grep -q 200"

# Postgres auth
PG_PASS=$(grep "^POSTGRES_PASSWORD=" "$ENV" | cut -d= -f2)
docker exec 03-system-postgres-1 psql -U coprem -d coprem_os \
  -c "SELECT 1" -q > /dev/null 2>&1 \
  && echo "| Postgres auth | OK |" >> /tmp/state.md \
  || echo "| Postgres auth | FAIL |" >> /tmp/state.md

# ── Auto-fix: Credential drift ────────────────────────────────
N8N_UP=$(curl -sf --max-time 3 http://localhost:5678/healthz 2>/dev/null && echo "yes" || echo "no")
if [[ "$N8N_UP" == "yes" ]]; then
  # Test if Postgres credential works by checking a recent execution
  CRED_OK=$(docker exec 03-system-postgres-1 psql -U coprem -d coprem -t -c \
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
  docker stop $ZOMBIE > /dev/null 2>&1
  echo "| Zombie containers | STOPPED | $ZOMBIE |" >> /tmp/state.md
fi

# ── Auto-fix: WEBHOOK_URL check ───────────────────────────────
WH_URL=$(docker exec 03-system-n8n-1 printenv WEBHOOK_URL 2>/dev/null)
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

if [[ "$TG_WH_URL" == *"$EXPECTED_WH_PATH"* ]]; then
  echo "| Telegram webhook | OK | $TG_WH_URL |" >> /tmp/state.md
else
  # Auto-fix: reset webhook to correct path
  FIX_RESULT=$(curl -s --max-time 5 "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
    -d "url=https://n8n.peabuntid.com/webhook/$EXPECTED_WH_PATH" \
    -d "allowed_updates=[\"message\"]" 2>/dev/null | \
    python3 -c "import json,sys; d=json.load(sys.stdin); print('FIXED' if d.get('ok') else 'FIX_FAILED')" 2>/dev/null)
  echo "| Telegram webhook | ${FIX_RESULT:-UNKNOWN} | was: $TG_WH_URL → reset to $EXPECTED_WH_PATH |" >> /tmp/state.md
fi

# ── Autonomous loop PID check ─────────────────────────────────
PID_FILE="$ROOT/logs/autonomous_loop.pid"
if [ -f "$PID_FILE" ]; then
  LOOP_PID=$(cat "$PID_FILE")
  if kill -0 "$LOOP_PID" 2>/dev/null; then
    echo "| Autonomous Loop | UP | PID $LOOP_PID (logs/autonomous_loop.pid) |" >> /tmp/state.md
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
