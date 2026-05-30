#!/bin/bash
# COPREM OS — Register Telegram Bot Webhook with n8n
# Usage: BOT_TOKEN=xxx ./register_telegram_webhook.sh
# Or: ./register_telegram_webhook.sh (uses env vars already set)

BOT_TOKEN="${BOT_TOKEN:-}"
NGROK_URL="${NGROK_URL:-https://wrinkle-sector-unclamped.ngrok-free.dev}"
WEBHOOK_ID="${WEBHOOK_ID:-8dec3cb8-492e-4782-b4a0-94b1b758c109}"

if [ -z "$BOT_TOKEN" ]; then
  echo "ERROR: BOT_TOKEN not set"
  exit 1
fi

WEBHOOK_URL="${NGROK_URL}/webhook/${WEBHOOK_ID}"

echo "Registering Telegram webhook..."
echo "URL: $WEBHOOK_URL"

RESULT=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"allowed_updates\": [\"message\"]}")

echo "Result: $RESULT"

# Verify
echo ""
echo "Verifying..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result',{}); print('URL:', r.get('url','')); print('Pending:', r.get('pending_update_count',0))"
