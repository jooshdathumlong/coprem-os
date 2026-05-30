#!/bin/bash
# COPREM OS — One-command startup
# Usage: ./start_coprem.sh
# Starts ngrok + n8n + registers Telegram webhook automatically

export PATH="$HOME/.npm-global/bin:$PATH"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
if [ -z "$BOT_TOKEN" ]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN not set. Run: export TELEGRAM_BOT_TOKEN=your_token"
  exit 1
fi

echo "=== COPREM OS Starting ==="

# 1. Kill any existing processes
pkill -f "node.*n8n" 2>/dev/null
pkill ngrok 2>/dev/null
sleep 2

# 2. Start ngrok
echo "[1/3] Starting ngrok..."
ngrok http 5678 --log=stdout > /tmp/ngrok.log 2>&1 &
sleep 5

# 3. Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tunnels', []):
    if 'https' in t.get('public_url', ''):
        print(t['public_url'])
" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo "ERROR: ngrok failed to start"
  exit 1
fi
echo "    ngrok URL: $NGROK_URL"

# 4. Start n8n
echo "[2/3] Starting n8n..."
WEBHOOK_URL=$NGROK_URL N8N_SECURE_COOKIE=false n8n start > /tmp/n8n.log 2>&1 &
sleep 10

# Wait for n8n ready
for i in {1..10}; do
  STATUS=$(curl -s http://localhost:5678/healthz 2>/dev/null)
  if echo "$STATUS" | grep -q "ok"; then break; fi
  sleep 2
done
echo "    n8n ready at http://localhost:5678"

# 5. Register Telegram webhook
echo "[3/3] Registering Telegram webhook..."
WEBHOOK_ID="coprem-telegram-001"
TELEGRAM_URL="${NGROK_URL}/webhook/${WEBHOOK_ID}"

RESULT=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${TELEGRAM_URL}\", \"allowed_updates\": [\"message\"]}")

if echo "$RESULT" | grep -q '"ok":true'; then
  echo "    Telegram webhook: $TELEGRAM_URL"
else
  echo "    WARNING: Telegram webhook registration may have failed"
  echo "    Run: BOT_TOKEN=$BOT_TOKEN NGROK_URL=$NGROK_URL ./register_telegram_webhook.sh"
fi

echo ""
echo "=== COPREM OS Ready ==="
echo "    n8n:      http://localhost:5678"
echo "    ngrok:    $NGROK_URL"
echo "    Telegram: @Coprem_Bot"
echo ""
echo "Login: jooshdathumlong@gmail.com / Jd982351+"
