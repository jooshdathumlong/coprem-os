#!/usr/bin/env python3
"""
edit_workflow.py — Safe n8n workflow editor.
Pattern: GET → patch node → DELETE → POST → activate → verify webhook.
Never use PUT directly (breaks webhook registration silently).

Usage:
  python3 scripts/edit_workflow.py --id <workflow_id> --node "Node Name" --field jsCode --value "..."
  python3 scripts/edit_workflow.py --id <workflow_id> --node "Node Name" --field jsCode --file /path/to/code.js
"""

import argparse, json, os, sys, time
import urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).parent.parent
ENV_FILE = ROOT / ".env"

def load_env():
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env

def api(method, path, env, body=None):
    url = f"http://localhost:5678/api/v1{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method,
        headers={"X-N8N-API-KEY": env["N8N_API_KEY"], "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:300]}")
        sys.exit(1)

def verify_webhook(env, expected_path="telegram-coprem"):
    time.sleep(5)
    result = api("GET", "/workflows", env)
    for wf in result.get("data", []):
        for node in wf.get("nodes", []):
            if node.get("type") == "n8n-nodes-base.webhook":
                p = node.get("parameters", {}).get("path", "")
                if expected_path in p:
                    print(f"  Webhook verified: /{p}")
                    return True
    return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", required=True, help="Workflow ID")
    parser.add_argument("--node", required=True, help="Node name to patch")
    parser.add_argument("--field", required=True, help="Parameter field to update")
    parser.add_argument("--value", help="New value (string)")
    parser.add_argument("--file", help="Read value from file")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env = load_env()

    if args.file:
        value = Path(args.file).read_text()
    elif args.value is not None:
        value = args.value
    else:
        print("ERROR: provide --value or --file"); sys.exit(1)

    print(f"[1/6] GET workflow {args.id}")
    wf = api("GET", f"/workflows/{args.id}", env)
    wf_backup = json.dumps(wf)

    node_found = False
    for node in wf["nodes"]:
        if node["name"] == args.node:
            node["parameters"][args.field] = value
            node_found = True
            print(f"  Patched node '{args.node}' field '{args.field}'")
            break
    if not node_found:
        print(f"ERROR: node '{args.node}' not found"); sys.exit(1)

    if args.dry_run:
        print("[DRY RUN] No changes applied."); return

    payload = {k: wf[k] for k in ["name","nodes","connections","settings","staticData"] if k in wf}

    print(f"[2/6] Backup saved ({len(wf_backup)} bytes in memory)")
    print(f"[3/6] DELETE workflow {args.id}")
    api("DELETE", f"/workflows/{args.id}", env)

    print("[4/6] POST new workflow")
    new_wf = api("POST", "/workflows", env, payload)
    new_id = new_wf["id"]
    print(f"  New ID: {new_id}")

    print("[5/6] Activate")
    api("POST", f"/workflows/{new_id}/activate", env)

    print("[6/6] Verify webhook")
    ok = verify_webhook(env)
    if ok:
        print(f"\nDone. New workflow ID: {new_id}")
    else:
        print("\nWARN: Webhook not detected — restart n8n manually:")
        print(f"  docker restart $(docker ps --filter label=coprem.service=n8n -q | head -1)")
        print(f"  New workflow ID: {new_id}")

if __name__ == "__main__":
    main()
