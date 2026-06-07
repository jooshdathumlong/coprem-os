#!/usr/bin/env bash
# verify_system.sh — COPREM OS path & consistency audit
# Run: bash scripts/verify_system.sh
# Exits 0 = all OK | 1 = issues found

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0

grn="\033[0;32m"; red="\033[0;31m"; yel="\033[0;33m"; rst="\033[0m"
ok()   { echo -e "  ${grn}OK${rst}   $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${red}FAIL${rst} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${yel}WARN${rst} $1"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " COPREM OS — System Verification  $(date '+%Y-%m-%d %H:%M')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Critical paths must exist ─────────────────────────────────────────────
echo ""
echo "[ 1 ] Critical paths"

REQUIRED_PATHS=(
  ".env"
  "CLAUDE.md"
  "SYSTEM_STATE.md"
  "STATUS.md"
  "INDEX.md"
  "scripts/autonomous_loop.py"
  "scripts/embed_kb.py"
  "scripts/gemini_router.py"
  "scripts/health_check.sh"
  "scripts/post_restart.sh"
  "scripts/start_coprem.sh"
  "scripts/stop_coprem.sh"
  "scripts/docker_wait_start.sh"
  "scripts/apply_migrations.sh"
  "03-system/docker-compose.yml"
  "03-system/logs"
  "03-system/dashboard"
  "03-system/db/migrations"
  "03-system/memory"
  "03-system/manifests"
  "03-system/workflows/exports"
  "02-knowledge/COPREM_Master_Context.md"
  "01-projects/prem-profile.md"
)

for p in "${REQUIRED_PATHS[@]}"; do
  [ -e "$ROOT/$p" ] && ok "$p" || fail "$p  ← MISSING"
done

# ── 2. Banned old path patterns in scripts ────────────────────────────────────
echo ""
echo "[ 2 ] Old path patterns (must be 0 matches)"

# These patterns indicate a stale reference before the folder restructure
# Format: "pattern|||description"
BANNED=(
  'ROOT/logs/|||should be ROOT/03-system/logs/'
  '="logs/autonomous_loop|||bare logs/ PID path (should be 03-system/logs/)'
  'ROOT / "logs"|||Python LOG_DIR should use 03-system/logs'
  'Coprem/logs/autonomous|||launchd plist log path not updated'
)

SCAN_DIRS=(
  "$ROOT/scripts"
  "$ROOT/03-system/scripts"
  "$HOME/Library/LaunchAgents"
  "$HOME/Library/Scripts/coprem"
)

for entry in "${BANNED[@]}"; do
  pattern="${entry%%|||*}"
  desc="${entry##*|||}"
  hits=$(grep -rn "$pattern" "${SCAN_DIRS[@]}" 2>/dev/null \
    | grep -v "verify_system" || true)
  if [ -n "$hits" ]; then
    fail "Stale pattern '$pattern' ($desc):"
    echo "$hits" | sed 's/^/       /'
  else
    ok "No stale '$pattern'"
  fi
done

# ── 3. Launchd agents loaded ──────────────────────────────────────────────────
echo ""
echo "[ 3 ] Launchd agents"

for label in com.coprem.autostart com.coprem.autonomous_loop; do
  if launchctl list "$label" > /dev/null 2>&1; then
    ok "$label loaded"
  else
    fail "$label NOT loaded — run: launchctl load ~/Library/LaunchAgents/${label}.plist"
  fi
done

# Plist log paths should point to 03-system/logs
for plist in "$HOME/Library/LaunchAgents"/com.coprem*.plist; do
  name=$(basename "$plist")
  old_ref=$(grep "coprem/Coprem/logs/" "$plist" 2>/dev/null || true)
  if [ -n "$old_ref" ]; then
    fail "$name: log path not updated to 03-system/logs"
  else
    ok "$name: log paths OK"
  fi
done

# ── 3b. Dashboard API path sanity ────────────────────────────────────────────
echo ""
echo "[ 3b ] Dashboard API paths"

CHAT_ROUTE="$ROOT/03-system/dashboard/app/api/chat/route.ts"
if [ -f "$CHAT_ROUTE" ]; then
  # ROOT must go up 2 levels (03-system/dashboard → repo root)
  if grep -q "process.cwd(), '\.\.', '\.\.')" "$CHAT_ROUTE"; then
    ok "chat/route.ts ROOT depth correct (2 levels up)"
  else
    fail "chat/route.ts ROOT depth wrong — dashboard moved to 03-system/, needs 2x '..'"
  fi
  # .env must not be hardcoded to a different path
  if grep -q "Desktop/Coprem" "$CHAT_ROUTE"; then
    fail "chat/route.ts: hardcoded Desktop path for .env"
  else
    ok "chat/route.ts: .env path not hardcoded"
  fi
  # prem-profile must point to 01-projects
  if grep -q "01-projects/prem-profile" "$CHAT_ROUTE"; then
    ok "chat/route.ts: prem-profile path → 01-projects/"
  else
    fail "chat/route.ts: prem-profile path wrong (should be 01-projects/prem-profile.md)"
  fi
else
  warn "chat/route.ts not found — skipping dashboard checks"
fi

# ── 4. Python import sanity ───────────────────────────────────────────────────
echo ""
echo "[ 4 ] Python import check"

for pyfile in autonomous_loop embed_kb gemini_router; do
  /usr/bin/python3 -c "
import ast, sys
src = open('$ROOT/scripts/${pyfile}.py').read()
ast.parse(src)
print('  OK   ${pyfile}.py syntax valid')
" 2>&1 || fail "${pyfile}.py has syntax error"
done

# ── 5. .env required keys ─────────────────────────────────────────────────────
echo ""
echo "[ 5 ] .env required keys"

REQUIRED_KEYS=(
  POSTGRES_PASSWORD
  LITELLM_MASTER_KEY
  TELEGRAM_BOT_TOKEN
  TELEGRAM_CHAT_ID
  N8N_API_KEY
  DIFY_KB_API_KEY
)

for key in "${REQUIRED_KEYS[@]}"; do
  val=$(grep "^${key}=" "$ROOT/.env" 2>/dev/null | cut -d= -f2- | tr -d ' ')
  if [ -n "$val" ]; then
    masked="${val:0:3}***${val: -3}"
    ok "$key = $masked"
  else
    fail "$key missing or empty in .env"
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS+FAIL))
if [ $FAIL -eq 0 ]; then
  echo -e " ${grn}ALL $TOTAL CHECKS PASSED${rst}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo -e " ${red}$FAIL FAILED${rst} / $TOTAL checks  ($PASS passed)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
