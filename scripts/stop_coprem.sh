#!/bin/bash
echo "Stopping COPREM dashboard..."
kill $(lsof -ti:3001) 2>/dev/null
echo "Done. Docker services still running (use docker compose down to stop)"
