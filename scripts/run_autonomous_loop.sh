#!/bin/bash
# Wrapper for launchd — bypasses macOS sandbox restriction on python3 direct exec
cd /Users/eilinaire/coprem/Coprem || exit 1
mkdir -p logs
exec /usr/bin/python3 scripts/autonomous_loop.py
