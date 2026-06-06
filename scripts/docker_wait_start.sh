#!/bin/bash
# docker_wait_start.sh — Wait for Docker Desktop ready, then start COPREM services
# Replaces hardcoded sleep timers in launchd autostart plist

ROOT="/Users/eilinaire/coprem/Coprem"
LOG="/tmp/coprem-autostart.log"
COMPOSE_FILE="$ROOT/03-system/docker-compose.yml"
MAX_WAIT=120

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"; }

# 1. Wait for Docker Desktop to respond
log "Waiting for Docker Desktop..."
ELAPSED=0
until docker info > /dev/null 2>&1; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    log "ERROR: Docker Desktop not ready after ${MAX_WAIT}s — aborting"
    exit 1
  fi
done
log "Docker Desktop ready (${ELAPSED}s)"

# 2. Start containers
log "Starting COPREM containers..."
cd "$ROOT"
docker compose -f "$COMPOSE_FILE" --env-file .env up -d 2>&1 | tail -5 | tee -a "$LOG"

# 3. Wait for postgres container to exist
log "Waiting for containers to start..."
ELAPSED=0
until docker ps --format "{{.Names}}" 2>/dev/null | grep -q "03-system-postgres-1"; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    log "WARNING: postgres container not found after ${MAX_WAIT}s — continuing anyway"
    break
  fi
done

# 4. Wait for postgres to accept connections
log "Waiting for Postgres to be ready..."
ELAPSED=0
until docker exec 03-system-postgres-1 pg_isready -U coprem -q > /dev/null 2>&1; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge 60 ]; then
    log "WARNING: Postgres not accepting connections after 60s — continuing"
    break
  fi
done
log "Postgres ready (${ELAPSED}s)"

# 5. Run post_restart
log "Running post_restart.sh..."
bash "$ROOT/scripts/post_restart.sh" 2>&1 | tee -a "$LOG"
log "COPREM startup complete"
