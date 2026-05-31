#!/usr/bin/env python3
"""
gemini_router.py — Gemini free-tier key rotation
Tries each key in order. On 429 quota error → marks throttled in Redis → tries next key.
Usage: python3 gemini_router.py '<prompt>'
"""

import os, sys, json, time, requests
from pathlib import Path

# Load .env
env_path = Path(__file__).parent.parent / ".env"
for line in env_path.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

KEYS = {
    "eilinaire":      os.environ.get("EILINAIRE_GOOGLE_API_KEY", ""),
    "jooshdathumlong": os.environ.get("JOOSHDATHUMLONG_GOOGLE_API_KEY", ""),
    "mahittisak":     os.environ.get("MAHITTISAK_GOOGLE_API_KEY", ""),
    "sunsetsol":      os.environ.get("SUNSETSOL_GOOGLE_API_KEY", ""),
    "rlie":           os.environ.get("RLIE_GOOGLE_API_KEY", ""),
}

THROTTLE_TTL_RPM = 60       # per-minute window
THROTTLE_TTL_DAY = 86400    # daily window
THROTTLE_FILE = Path("/tmp/gemini_throttled.json")
MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-lite-latest"]
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"


def get_throttled() -> set:
    if not THROTTLE_FILE.exists():
        return set()
    try:
        data = json.loads(THROTTLE_FILE.read_text())
        now = time.time()
        return {k for k, exp in data.items() if exp > now}
    except Exception:
        return set()


def mark_throttled(name: str, daily: bool = False):
    try:
        data = json.loads(THROTTLE_FILE.read_text()) if THROTTLE_FILE.exists() else {}
        ttl = THROTTLE_TTL_DAY if daily else THROTTLE_TTL_RPM
        data[name] = time.time() + ttl
        THROTTLE_FILE.write_text(json.dumps(data))
        label = "daily" if daily else "60s"
        print(f"[gemini_router] {name} throttled ({label})", file=sys.stderr)
    except Exception as e:
        print(f"[gemini_router] state error: {e}", file=sys.stderr)


def call_gemini(key: str, prompt: str) -> dict:
    url = API_URL.format(model=MODEL, key=key)
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    resp = requests.post(url, json=payload, timeout=30)
    return resp.status_code, resp.json() if resp.content else {}


def is_daily_quota(body: dict) -> bool:
    for detail in body.get("error", {}).get("details", []):
        for v in detail.get("violations", []):
            if "PerDay" in v.get("quotaId", ""):
                return True
    return False


def run(prompt: str):
    throttled = get_throttled()
    available = [(name, key) for name, key in KEYS.items() if name not in throttled and key]

    if not available:
        print(json.dumps({"error": "all_keys_throttled", "retry_after": THROTTLE_TTL_DAY}))
        sys.exit(1)

    for model in MODELS:
        for name, key in available:
            status, body = call_gemini(key, prompt)

            if status == 200:
                text = body.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                print(json.dumps({"key_used": name, "model": model, "text": text}))
                return

            elif status == 429:
                daily = is_daily_quota(body)
                mark_throttled(name, daily=daily)
                continue

            else:
                print(json.dumps({"error": f"key={name} status={status}", "body": body}))
                sys.exit(1)

    print(json.dumps({"error": "all_keys_exhausted_all_models"}))
    sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 gemini_router.py '<prompt>'")
        sys.exit(1)
    run(sys.argv[1])
