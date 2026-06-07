#!/bin/bash
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
export HOME="/Users/eilinaire"
cd /Users/eilinaire/coprem/Coprem
exec /usr/bin/python3 scripts/autonomous_loop.py
