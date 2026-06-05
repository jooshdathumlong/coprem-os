#!/bin/bash
echo "Stopping COPREM dashboard..."
kill $(lsof -ti:3001) 2>/dev/null

echo "Stopping autonomous loop..."
if [ -f "03-system/logs/autonomous_loop.pid" ]; then
  kill $(cat 03-system/logs/autonomous_loop.pid 2>/dev/null) 2>/dev/null
  rm -f 03-system/logs/autonomous_loop.pid
fi

echo "Done. Docker services still running (use docker compose down to stop)"
