#!/usr/bin/env bash
# สลับ Coprem ระหว่าง development และ production mode
# Usage: bash scripts/switch_env.sh [dev|prod]

MODE=${1:-""}

if [ -z "$MODE" ]; then
  CURRENT=$(grep "^COPREM_ENV=" .env | cut -d= -f2-)
  echo "Current mode: $CURRENT"
  echo "Usage: bash scripts/switch_env.sh [dev|prod]"
  exit 0
fi

ENV_FILE=".env"
DASHBOARD_ENV="03-system/dashboard/.env.local"

if [ "$MODE" = "dev" ]; then
  echo "🔧 Switching to DEVELOPMENT mode..."
  sed -i '' 's/^COPREM_ENV=.*/COPREM_ENV=development/' "$ENV_FILE"
  # Dashboard ใช้ DB dev
  sed -i '' 's|DATABASE_URL=postgresql://coprem:.*@localhost:5432/coprem_os$|DATABASE_URL=postgresql://coprem:'"$(grep POSTGRES_PASSWORD .env | cut -d= -f2-)"'@localhost:5432/coprem_os_dev|' "$DASHBOARD_ENV"
  sed -i '' 's/^PG_DB=.*/PG_DB=coprem_os_dev/' "$DASHBOARD_ENV"
  echo "✅ DEV mode: using coprem_os_dev DB, Telegram notifications disabled"

elif [ "$MODE" = "prod" ]; then
  echo "🚀 Switching to PRODUCTION mode..."
  sed -i '' 's/^COPREM_ENV=.*/COPREM_ENV=production/' "$ENV_FILE"
  # Dashboard ใช้ DB production
  sed -i '' 's|DATABASE_URL=postgresql://coprem:.*@localhost:5432/coprem_os_dev|DATABASE_URL=postgresql://coprem:'"$(grep POSTGRES_PASSWORD .env | cut -d= -f2-)"'@localhost:5432/coprem_os|' "$DASHBOARD_ENV"
  sed -i '' 's/^PG_DB=.*/PG_DB=coprem_os/' "$DASHBOARD_ENV"
  echo "✅ PROD mode: using coprem_os DB, all features active"

else
  echo "❌ Unknown mode: $MODE (use dev or prod)"
  exit 1
fi

echo ""
echo "Current .env:"
grep "COPREM_ENV\|PG_DB" "$ENV_FILE" "$DASHBOARD_ENV" 2>/dev/null
