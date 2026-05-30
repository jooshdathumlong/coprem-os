#!/bin/bash
# Setup GitHub Actions Self-hosted Runner on Mac
# Run once: ./setup-github-runner.sh

echo "=== COPREM GitHub Runner Setup ==="
echo ""
echo "Step 1: Go to GitHub repo → Settings → Actions → Runners → New self-hosted runner"
echo "        Select: macOS | Architecture: ARM64"
echo "        Copy the token shown (starts with A...)"
echo ""
read -p "Paste your runner token: " RUNNER_TOKEN
read -p "Paste your repo URL (e.g. https://github.com/jooshdathumlong/coprem-os): " REPO_URL

mkdir -p ~/actions-runner && cd ~/actions-runner

# Download runner
curl -o actions-runner-osx-arm64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-osx-arm64-2.317.0.tar.gz
tar xzf actions-runner-osx-arm64.tar.gz

# Configure
./config.sh --url "$REPO_URL" --token "$RUNNER_TOKEN" --name "coprem-mac" --labels "self-hosted,macOS" --unattended

# Install as service (auto-start)
./svc.sh install
./svc.sh start

echo ""
echo "✅ Runner installed and started"
echo ""
echo "Step 2: Add GitHub Secrets at $REPO_URL/settings/secrets/actions"
echo "  TELEGRAM_BOT_TOKEN = (from .env)"
echo "  PREM_CHAT_ID       = (from .env)"
echo "  N8N_PASSWORD       = (from .env)"
