#!/bin/bash
# post_restart.sh — Run after every n8n restart.
# Fixes credentials, verifies webhook, deactivates/activates WF01.

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

# 3. Check for zombie containers (wrong network)
ZOMBIE=$(docker ps --format "{{.Names}}" | grep "^coprem-" | grep -v "03-system")
if [ -n "$ZOMBIE" ]; then
  log "⚠️  Zombie containers found: $ZOMBIE"
  log "Stopping zombie containers..."
  echo "$ZOMBIE" | xargs docker stop
  log "Zombie containers stopped ✅"
fi

# 4. Deactivate + reactivate WF01 to refresh Telegram webhook secret
log "Refreshing WF01 Telegram webhook..."
N8N_API_KEY_VAL=$(grep "^N8N_API_KEY=" "$ENV" | cut -d= -f2)
WF01_ID="OTZhayuBBmCOO2CA"

curl -sf -X POST -H "X-N8N-API-KEY: $N8N_API_KEY_VAL" \
  "http://localhost:5678/api/v1/workflows/$WF01_ID/deactivate" > /dev/null
sleep 2
curl -sf -X POST -H "X-N8N-API-KEY: $N8N_API_KEY_VAL" \
  "http://localhost:5678/api/v1/workflows/$WF01_ID/activate" > /dev/null
log "WF01 webhook refreshed ✅"

# 5. Verify Telegram webhook registered
sleep 3
BOT_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" "$ENV" | cut -d= -f2)
WH_URL=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'].get('url','EMPTY'))")
if [[ "$WH_URL" == *"n8n.peabuntid.com"* ]]; then
  log "Telegram webhook: ✅ $WH_URL"
else
  log "Telegram webhook: ❌ $WH_URL"
fi

# 6. Ensure Prem is in users table
docker exec 03-system-postgres-1 psql -U coprem -d coprem_os -t -c \
  "INSERT INTO users (chat_id, first_name, username, status, approved_at)
   VALUES (7731591925, 'Prem', 'prem', 'approved', NOW())
   ON CONFLICT (chat_id) DO NOTHING;" > /dev/null 2>&1
log "Prem user: ✅ ensured"

log "post_restart complete ✅"
