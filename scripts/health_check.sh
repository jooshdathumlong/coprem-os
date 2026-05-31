#!/bin/bash
# health_check.sh — run at session start and end

echo "## SYSTEM_STATE — $(date '+%Y-%m-%d %H:%M')" > /tmp/state.md

# Infrastructure
check() {
  local name=$1 cmd=$2 note=$3
  eval "$cmd" > /dev/null 2>&1
  status=$([[ $? -eq 0 ]] && echo "UP" || echo "DOWN")
  echo "| $name | $status | ${note} |" >> /tmp/state.md
}

check "n8n" "curl -sf --max-time 5 http://localhost:5678/healthz"
check "postgres" "docker exec 03-system-postgres-1 pg_isready -U coprem -d coprem_os -q"
check "redis" "docker exec 03-system-redis-1 redis-cli ping" "PONG"
check "dify" "curl -sf --max-time 5 http://localhost/health"

# Credential test (ไม่ print password)
PG_PASS=$(grep "^POSTGRES_PASSWORD=" .env | cut -d= -f2)
docker exec 03-system-postgres-1 psql -U coprem -d coprem_os \
  -c "SELECT 1" -q > /dev/null 2>&1 \
  && echo "| Postgres auth | OK |" >> /tmp/state.md \
  || echo "| Postgres auth | FAIL |" >> /tmp/state.md

cat /tmp/state.md