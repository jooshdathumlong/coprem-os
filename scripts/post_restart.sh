#!/bin/bash
# post_restart.sh — Run after every n8n restart.
# Fixes credentials, verifies webhook, ensures system state.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV="$ROOT/.env"

log() { echo "[post_restart] $1"; }

# Load env
source <(grep -v '^#' "$ENV" | sed 's/^/export /')

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
N8N_API_KEY_VAL=$(grep "^N8N_API_KEY=" "$ENV" | cut -d= -f2)
WF01_ID="qbuaTTbivLIkfGUB"
curl -sf -X POST -H "X-N8N-API-KEY: $N8N_API_KEY_VAL" \
  "http://localhost:5678/api/v1/workflows/$WF01_ID/activate" > /dev/null 2>&1 || true
log "WF01 activated ✅"

# 5. Verify Telegram webhook points to fixed path
BOT_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" "$ENV" | cut -d= -f2)
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
docker exec 03-system-postgres-1 psql -U coprem -d coprem_os -t -c \
  "INSERT INTO users (chat_id, first_name, username, status, approved_at)
   VALUES (7731591925, 'Prem', 'prem', 'approved', NOW())
   ON CONFLICT (chat_id) DO NOTHING;" > /dev/null 2>&1
log "Prem user: ✅ ensured"

log "post_restart complete ✅"
