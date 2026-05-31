#!/bin/sh
# COPREM OS — Local setup (run once after cloning)

set -e

echo "=== COPREM OS Setup ==="

# 1. Git hooks
git config core.hooksPath scripts/hooks
chmod +x scripts/hooks/pre-commit
echo "✅ Git hooks installed (scripts/hooks)"

# 2. .env check
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null && echo "✅ .env created from .env.example" \
    || echo "⚠️  No .env found — create one from .env.example before running Docker"
else
  echo "✅ .env exists"
fi

# 3. Docker check
if ! command -v docker >/dev/null 2>&1; then
  echo "⚠️  Docker not found — install Docker Desktop before running stack"
else
  echo "✅ Docker available"
fi

echo ""
echo "Setup complete. Run: docker compose -f 03-system/docker-compose.yml up -d"
