#!/bin/bash
# sync_docs.sh — Auto-sync all docs from live system state.
# Run: bash scripts/sync_docs.sh
# Or:  coprem sync

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV="$ROOT/.env"

log() { echo "[sync] $1"; }

# 1. SYSTEM_STATE.md — from health_check
log "Updating SYSTEM_STATE.md..."
bash "$ROOT/scripts/health_check.sh" > "$ROOT/SYSTEM_STATE.md" 2>/dev/null
log "SYSTEM_STATE.md ✅"

# 2. INDEX.md — auto-register new files in scripts/
log "Checking INDEX.md for new files..."
for f in "$ROOT/scripts/"*.sh "$ROOT/scripts/"*.py; do
  fname=$(basename "$f")
  if ! grep -q "$fname" "$ROOT/INDEX.md" 2>/dev/null; then
    echo "| \`scripts/$fname\` | (auto-registered $(date +%Y-%m-%d)) |" >> "$ROOT/INDEX.md"
    log "INDEX.md: added $fname"
  fi
done
log "INDEX.md ✅"

# 3. Export active n8n workflows
log "Exporting n8n workflows..."
N8N_KEY=$(grep "^N8N_API_KEY=" "$ENV" | cut -d= -f2)
EXPORT_DIR="$ROOT/03-system/workflows/exports"

python3 << PYEOF
import json, urllib.request, os

N8N_KEY = "$N8N_KEY"
export_dir = "$EXPORT_DIR"

try:
    req = urllib.request.Request("http://localhost:5678/api/v1/workflows?limit=50",
        headers={"X-N8N-API-KEY": N8N_KEY})
    wfs = json.loads(urllib.request.urlopen(req, timeout=10).read()).get("data", [])
    count = 0
    for wf in wfs:
        if wf.get("active"):
            req2 = urllib.request.Request(f"http://localhost:5678/api/v1/workflows/{wf['id']}",
                headers={"X-N8N-API-KEY": N8N_KEY})
            data = urllib.request.urlopen(req2, timeout=10).read()
            fname = f"{wf['name']}.json"
            open(os.path.join(export_dir, fname), "wb").write(data)
            count += 1
    print(f"[sync] {count} workflows exported ✅")
except Exception as e:
    print(f"[sync] workflow export skipped: {e}")
PYEOF

# 4. Git commit if anything changed
cd "$ROOT"
git add SYSTEM_STATE.md INDEX.md 03-system/workflows/exports/ 2>/dev/null
if ! git diff --cached --quiet 2>/dev/null; then
  git commit -m "ops(sync): auto-sync docs + workflow exports [$(date +%Y-%m-%d)]" 2>/dev/null
  log "git commit ✅"
else
  log "nothing to commit"
fi

log "Done ✅"
