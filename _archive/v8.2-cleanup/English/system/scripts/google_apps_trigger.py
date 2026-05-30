#!/usr/bin/env python3
"""
google_apps_trigger.py — Coprem Google Apps Script Trigger
--------------------------------------------------------------
Sends structured commands to a Google Apps Script (GAS) Web App
deployed as a Cloud-Native automation endpoint.

The GAS handles: Drive file creation, Gmail drafting/sending,
Calendar event creation, and Docs content insertion.

⚠️  HITL PROTOCOL: This script will only execute via `run_command`
    after Prem has reviewed the executive report and typed "Approved".

Prerequisites:
  pip install requests python-dotenv

Usage:
  python3 google_apps_trigger.py create_doc  "Doc Title" "Doc Content"
  python3 google_apps_trigger.py send_email  "to@email.com" "Subject" "Body"
  python3 google_apps_trigger.py create_event "Event Title" "2025-06-01" "10:00" "11:00"
  python3 google_apps_trigger.py save_to_drive "filename.md" "File content here"
"""

import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parents[2] / ".env.vault")

GAS_URL = os.getenv("GOOGLE_APPS_SCRIPT_URL")


def trigger_gas(action: str, payload: dict) -> dict:
    """
    Send a POST request to the deployed GAS Web App.
    The GAS must be deployed as 'Execute as Me' and 'Anyone (with link)'.
    """
    if not GAS_URL or "YOUR_DEPLOYMENT_ID" in GAS_URL:
        return {"error": "GOOGLE_APPS_SCRIPT_URL is not configured in .env.vault"}

    data = {"action": action, **payload}
    r = requests.post(GAS_URL, json=data, timeout=30)
    try:
        return {"action": action, "status": r.status_code, "response": r.json()}
    except Exception:
        return {"action": action, "status": r.status_code, "response": r.text}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: google_apps_trigger.py [create_doc|send_email|create_event|save_to_drive] ...")
        sys.exit(1)

    action = sys.argv[1].lower()

    if action == "create_doc" and len(sys.argv) >= 4:
        result = trigger_gas("create_doc", {"title": sys.argv[2], "content": sys.argv[3]})
    elif action == "send_email" and len(sys.argv) >= 5:
        result = trigger_gas("send_email", {"to": sys.argv[2], "subject": sys.argv[3], "body": sys.argv[4]})
    elif action == "create_event" and len(sys.argv) >= 6:
        result = trigger_gas("create_event", {"title": sys.argv[2], "date": sys.argv[3], "start": sys.argv[4], "end": sys.argv[5]})
    elif action == "save_to_drive" and len(sys.argv) >= 4:
        result = trigger_gas("save_to_drive", {"filename": sys.argv[2], "content": sys.argv[3]})
    else:
        print("Invalid arguments.")
        sys.exit(1)

    print(json.dumps(result, indent=2, ensure_ascii=False))
