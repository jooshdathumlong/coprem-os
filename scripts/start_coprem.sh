#!/bin/bash
# COPREM OS Launcher — starts all services and opens dashboard
cd "$(dirname "$0")/.." || exit 1

# 1. Start Docker services if not running
RUNNING=$(docker ps --filter name=coprem -q 2>/dev/null | wc -l | tr -d ' ')
if [ "$RUNNING" -lt 3 ]; then
  echo "Starting Docker services..."
  docker compose -f 03-system/docker-compose.yml up -d 2>&1 | tail -5
  sleep 5
fi

# 2. Start Next.js dashboard if not running
DASH_PID=$(lsof -ti:3001 2>/dev/null)
if [ -z "$DASH_PID" ]; then
  echo "Starting dashboard..."
  cd dashboard
  nohup npm run dev > /tmp/coprem-dashboard.log 2>&1 &
  cd ..
  sleep 4
fi

# 3. Start autonomous loop daemon if not running
mkdir -p logs
LOOP_PID_FILE="logs/autonomous_loop.pid"
LOOP_RUNNING=false
if [ -f "$LOOP_PID_FILE" ]; then
  LOOP_PID=$(cat "$LOOP_PID_FILE" 2>/dev/null)
  if [ -n "$LOOP_PID" ] && kill -0 "$LOOP_PID" 2>/dev/null; then
    LOOP_RUNNING=true
  fi
fi
if [ "$LOOP_RUNNING" = false ]; then
  echo "Starting autonomous loop..."
  nohup python3 scripts/autonomous_loop.py >> logs/autonomous_loop.log 2>&1 &
  echo $! > logs/autonomous_loop.pid
  echo "  Autonomous loop PID: $(cat logs/autonomous_loop.pid)"
fi

# 4. Open dashboard in Chrome App Mode (standalone window, no browser UI)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -f "$CHROME" ]; then
  "$CHROME" --app=http://localhost:3001 \
    --window-size=1280,800 \
    --window-position=100,50 \
    --no-first-run \
    --disable-extensions \
    --user-data-dir=/tmp/coprem-chrome-profile &
else
  open http://localhost:3001
fi
echo "COPREM OS launched"
