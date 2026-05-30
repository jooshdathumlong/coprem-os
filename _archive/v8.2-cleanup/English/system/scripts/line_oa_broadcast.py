#!/usr/bin/env python3
"""
line_oa_broadcast.py — Coprem LINE Official Account Direct Broadcaster
------------------------------------------------------------------------
Sends Push or Broadcast messages directly via LINE Messaging API.
No middleware. No Make.com. Direct HTTP call only.

⚠️  HITL PROTOCOL: This script will only execute via `run_command`
    after Prem has reviewed the executive report and typed "Approved".

Prerequisites:
  pip install requests python-dotenv

Key Concepts:
  - Push Message:      Sends to a specific user ID (requires userId).
  - Broadcast Message: Sends to ALL followers of your LINE OA at once.
  - Multicast:         Sends to a specific list of up to 500 user IDs.

Usage:
  python3 line_oa_broadcast.py broadcast "Your message text"
  python3 line_oa_broadcast.py push      "USER_LINE_ID" "Your message text"
  python3 line_oa_broadcast.py multicast "uid1,uid2,uid3" "Your message text"
"""

import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parents[2] / ".env.vault")

LINE_TOKEN  = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
LINE_SECRET = os.getenv("LINE_CHANNEL_SECRET")

BASE_URL = "https://api.line.me/v2/bot"
HEADERS  = {
    "Authorization": f"Bearer {LINE_TOKEN}",
    "Content-Type":  "application/json",
}


def build_text_message(text: str) -> dict:
    """Build a simple text message object."""
    return {"type": "text", "text": text}


def broadcast(text: str) -> dict:
    """
    Broadcast a message to ALL followers.
    Note: Requires a Verified or Premium LINE OA to use the Broadcast API.
    """
    url = f"{BASE_URL}/message/broadcast"
    payload = {"messages": [build_text_message(text)]}
    r = requests.post(url, headers=HEADERS, json=payload, timeout=15)
    return {"action": "broadcast", "status": r.status_code, "response": r.text}


def push(user_id: str, text: str) -> dict:
    """Push a message to a specific user by their LINE userId."""
    url = f"{BASE_URL}/message/push"
    payload = {"to": user_id, "messages": [build_text_message(text)]}
    r = requests.post(url, headers=HEADERS, json=payload, timeout=15)
    return {"action": "push", "to": user_id, "status": r.status_code, "response": r.text}


def multicast(user_ids: list, text: str) -> dict:
    """
    Multicast a message to a list of user IDs (max 500 per call).
    Cost-effective alternative to broadcast for targeted groups.
    """
    url = f"{BASE_URL}/message/multicast"
    payload = {"to": user_ids, "messages": [build_text_message(text)]}
    r = requests.post(url, headers=HEADERS, json=payload, timeout=15)
    return {"action": "multicast", "recipients": len(user_ids), "status": r.status_code, "response": r.text}


def get_profile(user_id: str) -> dict:
    """Retrieve a follower's profile by userId."""
    url = f"{BASE_URL}/profile/{user_id}"
    r = requests.get(url, headers=HEADERS, timeout=10)
    return r.json()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: line_oa_broadcast.py [broadcast|push|multicast] [user_id/user_ids (CSV)] [text]")
        sys.exit(1)

    action = sys.argv[1].lower()

    if action == "broadcast":
        text = sys.argv[2]
        print(json.dumps(broadcast(text), indent=2, ensure_ascii=False))

    elif action == "push" and len(sys.argv) >= 4:
        uid  = sys.argv[2]
        text = sys.argv[3]
        print(json.dumps(push(uid, text), indent=2, ensure_ascii=False))

    elif action == "multicast" and len(sys.argv) >= 4:
        uid_list = sys.argv[2].split(",")
        text     = sys.argv[3]
        print(json.dumps(multicast(uid_list, text), indent=2, ensure_ascii=False))

    else:
        print("Invalid arguments. Check usage at top of file.")
        sys.exit(1)
