#!/usr/bin/env bash
# Unload all Ollama models from RAM (except nomic-embed-text which is lightweight)
# Run manually when machine feels slow, or via cron

OLLAMA_URL="http://localhost:11434"

echo "=== Ollama RAM Cleanup ==="
LOADED=$(curl -s "$OLLAMA_URL/api/ps" 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
models=d.get('models',[])
for m in models:
    print(m['name'], m.get('size_vram',0)//1024//1024, 'MB')
" 2>/dev/null)

if [ -z "$LOADED" ]; then
  echo "No models loaded — RAM is free"
  exit 0
fi

echo "Currently loaded:"
echo "$LOADED"

# Unload all models
curl -s "$OLLAMA_URL/api/ps" 2>/dev/null | python3 -c "
import sys,json,subprocess
for m in json.load(sys.stdin).get('models',[]):
    name=m['name']
    payload='{\"model\":\"'+name+'\",\"keep_alive\":0,\"messages\":[{\"role\":\"user\",\"content\":\"\"}]}'
    subprocess.run(['curl','-s','-X','POST',f'http://localhost:11434/api/chat','-H','Content-Type: application/json','-d',payload], capture_output=True)
    print(f'Unloaded: {name}')
" 2>/dev/null

sleep 2
FREE=$(top -l1 -n0 2>/dev/null | grep PhysMem | awk '{print $6}')
echo "RAM free after cleanup: $FREE"
