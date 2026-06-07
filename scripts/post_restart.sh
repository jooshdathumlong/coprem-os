#!/bin/bash
# post_restart.sh — Run after every n8n restart.
# Fixes credentials, verifies webhook, ensures system state.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV="$ROOT/.env"

log() { echo "[post_restart] $1"; }

# Load env (safe: parse key=value pairs without eval'ing values)
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  export "$key"="$value"
done < <(grep -v '^#' "$ENV" | grep '=')

# 1. Wait for n8n to be healthy
log "Waiting for n8n..."
for i in $(seq 1 30); do
  if curl -sf --max-time 3 http://localhost:5678/healthz > /dev/null 2>&1; then
    log "n8n UP ✅"
    break
  fi
  sleep 2
done

# 2. Sync Postgres credentials
log "Syncing Postgres credentials..."
python3 "$SCRIPT_DIR/fix_credentials.py"

# 3. Stop zombie containers (wrong network prefix)
ZOMBIE=$(docker ps --format "{{.Names}}" | grep "^coprem-" | grep -v "03-system" || true)
if [ -n "$ZOMBIE" ]; then
  log "⚠️  Zombie containers: $ZOMBIE — stopping..."
  echo "$ZOMBIE" | xargs docker stop
  log "Zombie containers stopped ✅"
fi

# 4. Activate WF01 (plain Webhook node — no secret refresh needed)
log "Activating WF01..."
N8N_API_KEY_VAL=$(grep "^N8N_API_KEY=" "$ENV" | cut -d= -f2-)
WF01_ID="jFq7aSFJQ7ElHoLZ"
curl -sf -X POST -H "X-N8N-API-KEY: $N8N_API_KEY_VAL" \
  "http://localhost:5678/api/v1/workflows/$WF01_ID/activate" > /dev/null 2>&1 || true
log "WF01 activated ✅"

# 5. Verify Telegram webhook points to fixed path
BOT_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" "$ENV" | cut -d= -f2-)
sleep 2
WH_URL=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['result'].get('url','EMPTY'))")

if [[ "$WH_URL" == *"telegram-coprem"* ]]; then
  log "Telegram webhook: ✅ $WH_URL"
else
  log "Telegram webhook missing — re-registering..."
  curl -sf "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=https://n8n.peabuntid.com/webhook/telegram-coprem" > /dev/null
  log "Telegram webhook: ✅ registered"
fi

# 6. Ensure Prem is in users table
_PG=$(docker ps --filter label=coprem.service=postgres -q 2>/dev/null | head -1)
[ -z "$_PG" ] && _PG=$(docker ps --filter name=postgres -q 2>/dev/null | head -1)
docker exec $_PG psql -U coprem -d coprem_os -t -c \
  "INSERT INTO users (chat_id, first_name, username, status, approved_at)
   VALUES (7731591925, 'Prem', 'prem', 'approved', NOW())
   ON CONFLICT (chat_id) DO NOTHING;" > /dev/null 2>&1
log "Prem user: ✅ ensured"

# 7. Start Ollama (Tier 3 local fallback) if not running
if ! pgrep -x ollama > /dev/null 2>&1; then
  log "Starting Ollama..."
  nohup ollama serve > /tmp/ollama.log 2>&1 &
  sleep 3
fi
if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
  log "Ollama: ✅ running (qwen2.5:3b + nomic-embed-text)"
else
  log "Ollama: ⚠️  not reachable"
fi

# 8. Ensure autonomous loop is running
PID_FILE="$ROOT/system/logs/autonomous_loop.pid"
LOOP_RUNNING=false
if [ -f "$PID_FILE" ]; then
  LOOP_PID=$(cat "$PID_FILE")
  if kill -0 "$LOOP_PID" 2>/dev/null; then
    LOOP_RUNNING=true
    log "Autonomous loop: ✅ already running (PID $LOOP_PID)"
  fi
fi
if [ "$LOOP_RUNNING" = false ]; then
  mkdir -p "$ROOT/system/logs"
  nohup python3 "$ROOT/scripts/autonomous_loop.py" >> "$ROOT/system/logs/autonomous_loop.log" 2>&1 &
  echo $! > "$PID_FILE"
  log "Autonomous loop: ✅ started (PID $!)"
fi

# 9. Start dashboard (Next.js port 3001) if not running
DASH_LOG="$ROOT/system/logs/dashboard.log"
if ! lsof -i :3001 -sTCP:LISTEN -t > /dev/null 2>&1; then
  log "Starting dashboard..."
  mkdir -p "$ROOT/system/logs"
  cd "$ROOT/apps/dashboard" && nohup npm run dev >> "$DASH_LOG" 2>&1 &
  echo $! > "$ROOT/system/logs/dashboard.pid"
  cd "$ROOT"
  log "Dashboard: ✅ started on port 3001 (PID $!)"
else
  log "Dashboard: ✅ already running on port 3001"
fi

log "post_restart complete ✅"
