#!/usr/bin/env python3
"""
social_broadcast.py — Coprem Direct Social Graph API Broadcaster
-------------------------------------------------------------------
Posts content directly to Facebook, Instagram, X (Twitter), and TikTok
with NO middleware (no Zapier, no Make.com).

⚠️  HITL PROTOCOL: This script will only execute via `run_command`
    after Prem has reviewed the executive report and typed "Approved".

Prerequisites:
  pip install requests python-dotenv

Usage:
  python3 social_broadcast.py facebook  "Your post text here"
  python3 social_broadcast.py instagram "Your caption here" "/path/to/image.jpg"
  python3 social_broadcast.py twitter   "Your tweet text"
  python3 social_broadcast.py tiktok    "Your video description" "/path/to/video.mp4"
  python3 social_broadcast.py all       "Cross-post text"
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parents[2] / ".env.vault")

# Load tokens from vault
FB_PAGE_ID          = os.getenv("FB_PAGE_ID")
FB_PAGE_TOKEN       = os.getenv("FB_PAGE_ACCESS_TOKEN")
IG_USER_ID          = os.getenv("IG_USER_ID")
IG_TOKEN            = os.getenv("IG_ACCESS_TOKEN")
TW_API_KEY          = os.getenv("TWITTER_API_KEY")
TW_API_SECRET       = os.getenv("TWITTER_API_SECRET")
TW_ACCESS_TOKEN     = os.getenv("TWITTER_ACCESS_TOKEN")
TW_ACCESS_SECRET    = os.getenv("TWITTER_ACCESS_SECRET")
TW_BEARER_TOKEN     = os.getenv("TWITTER_BEARER_TOKEN")
TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN")


# ─────────────────────────────────────────────
# FACEBOOK
# ─────────────────────────────────────────────
def post_to_facebook(text: str) -> dict:
    """Publish a text post to the Facebook Page."""
    url = f"https://graph.facebook.com/v19.0/{FB_PAGE_ID}/feed"
    payload = {"message": text, "access_token": FB_PAGE_TOKEN}
    r = requests.post(url, data=payload, timeout=15)
    return {"platform": "facebook", "status": r.status_code, "response": r.json()}


# ─────────────────────────────────────────────
# INSTAGRAM
# ─────────────────────────────────────────────
def post_to_instagram(caption: str, image_url: str) -> dict:
    """
    Publish a photo post to Instagram via Graph API.
    image_url must be a publicly accessible URL (not a local path).
    """
    # Step 1: Create media container
    create_url = f"https://graph.facebook.com/v19.0/{IG_USER_ID}/media"
    payload = {"image_url": image_url, "caption": caption, "access_token": IG_TOKEN}
    r1 = requests.post(create_url, data=payload, timeout=15)
    container_id = r1.json().get("id")
    if not container_id:
        return {"platform": "instagram", "error": "Container creation failed", "response": r1.json()}

    # Step 2: Publish container
    publish_url = f"https://graph.facebook.com/v19.0/{IG_USER_ID}/media_publish"
    r2 = requests.post(publish_url, data={"creation_id": container_id, "access_token": IG_TOKEN}, timeout=15)
    return {"platform": "instagram", "status": r2.status_code, "response": r2.json()}


# ─────────────────────────────────────────────
# X / TWITTER
# ─────────────────────────────────────────────
def post_to_twitter(text: str) -> dict:
    """Post a tweet via X API v2."""
    import hmac, hashlib, time, uuid, base64, urllib.parse

    url = "https://api.twitter.com/2/tweets"
    headers = {"Content-Type": "application/json"}

    # OAuth 1.0a signing
    timestamp = str(int(time.time()))
    nonce = uuid.uuid4().hex
    params = {
        "oauth_consumer_key": TW_API_KEY,
        "oauth_nonce": nonce,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": timestamp,
        "oauth_token": TW_ACCESS_TOKEN,
        "oauth_version": "1.0",
    }
    base_string = "&".join([
        "POST",
        urllib.parse.quote(url, safe=""),
        urllib.parse.quote("&".join(f"{k}={urllib.parse.quote(v, safe='')}" for k, v in sorted(params.items())), safe=""),
    ])
    signing_key = f"{urllib.parse.quote(TW_API_SECRET, safe='')}&{urllib.parse.quote(TW_ACCESS_SECRET, safe='')}"
    signature = base64.b64encode(hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()).decode()
    params["oauth_signature"] = signature
    auth_header = "OAuth " + ", ".join(f'{k}="{urllib.parse.quote(v, safe="")}"' for k, v in sorted(params.items()))

    r = requests.post(url, json={"text": text}, headers={**headers, "Authorization": auth_header}, timeout=15)
    return {"platform": "twitter", "status": r.status_code, "response": r.json()}


# ─────────────────────────────────────────────
# TIKTOK
# ─────────────────────────────────────────────
def post_to_tiktok(description: str, video_path: str) -> dict:
    """
    Initiate a TikTok video upload. Note: TikTok's Creator API requires
    a video upload via their chunked upload flow. This initiates the process.
    """
    url = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
    headers = {"Authorization": f"Bearer {TIKTOK_ACCESS_TOKEN}", "Content-Type": "application/json"}
    payload = {
        "post_info": {"title": description, "privacy_level": "PUBLIC_TO_EVERYONE"},
        "source_info": {"source": "FILE_UPLOAD"}
    }
    r = requests.post(url, json=payload, headers=headers, timeout=15)
    return {"platform": "tiktok", "status": r.status_code, "response": r.json(),
            "note": "Video upload initiated. Follow upload_url from response to complete."}


# ─────────────────────────────────────────────
# DISPATCHER
# ─────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: social_broadcast.py [facebook|instagram|twitter|tiktok|all] [text] [optional: image/video path]")
        sys.exit(1)

    platform = sys.argv[1].lower()
    text     = sys.argv[2]
    media    = sys.argv[3] if len(sys.argv) > 3 else None

    results = []
    if platform in ("facebook", "all"):
        results.append(post_to_facebook(text))
    if platform in ("instagram", "all") and media:
        results.append(post_to_instagram(text, media))
    if platform in ("twitter", "all"):
        results.append(post_to_twitter(text))
    if platform in ("tiktok", "all") and media:
        results.append(post_to_tiktok(text, media))

    import json
    print(json.dumps(results, indent=2, ensure_ascii=False))
