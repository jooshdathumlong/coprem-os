#!/usr/bin/env bash
# COPREM OS — Apply DB Migrations 002-004
# Run: bash scripts/apply_migrations.sh
# Idempotent: safe to re-run. Skips if constraint/table already exists.

set -euo pipefail

CONTAINER="03-system-postgres-1"
DB_USER="coprem"
DB_NAME="coprem_os"
MIGRATIONS_DIR="$(dirname "$0")/../03-system/db/migrations"

echo "=== COPREM Migration Runner ==="
echo "Container : $CONTAINER"
echo "Database  : $DB_NAME"
echo ""

for FILE in \
  "$MIGRATIONS_DIR/002_add_event_type_check.sql" \
  "$MIGRATIONS_DIR/003_add_query_log.sql" \
  "$MIGRATIONS_DIR/004_add_system_log_json_sink.sql"; do

  NAME=$(basename "$FILE")
  echo "▶ Applying $NAME ..."
  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    --set ON_ERROR_STOP=1 -q < "$FILE" \
    && echo "  ✅ $NAME done" \
    || { echo "  ❌ $NAME FAILED — stopping"; exit 1; }
done

echo ""
echo "=== Verify ==="
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -q -c \
  "SELECT conname FROM pg_constraint WHERE conname = 'audit_log_event_type_check';" \
  && echo "✅ event_type CHECK constraint present"

docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -q -c \
  "SELECT to_regclass('public.query_log'), to_regclass('public.system_log');"

echo ""
echo "=== All migrations applied successfully ==="
