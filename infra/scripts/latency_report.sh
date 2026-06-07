#!/bin/bash
# S6 — Latency report: top 5 slowest layers from v_latency_by_layer
PG=$(docker ps --filter name=postgres -q 2>/dev/null | head -1)
if [ -z "$PG" ]; then
  echo "ERROR: Postgres container not found"
  exit 1
fi

echo "=== COPREM Latency Report (top 5 slowest layers) ==="
docker exec "$PG" psql -U coprem -d coprem_os -c \
  "SELECT event_type, avg_ms, max_ms, requests, slow_count FROM v_latency_by_layer LIMIT 5;" 2>&1
