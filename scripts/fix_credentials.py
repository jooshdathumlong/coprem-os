#!/usr/bin/env python3
"""
fix_credentials.py — Sync n8n Postgres credentials with current .env password.
Run after every n8n restart to prevent "password authentication failed" errors.
"""

import json, base64, hashlib, secrets, subprocess, sys
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

ENV_PATH = Path(__file__).parent.parent / ".env"

def load_env():
    env = {}
    for line in ENV_PATH.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env

def encrypt(data_dict, enc_key):
    plain = json.dumps(data_dict).encode()
    pad = 16 - (len(plain) % 16)
    padded = plain + bytes([pad] * pad)
    salt = secrets.token_bytes(8)
    def evp(pw, s, kl=32, il=16):
        d, di = b"", b""
        while len(d) < kl + il:
            di = hashlib.md5(di + pw.encode() + s).digest()
            d += di
        return d[:kl], d[kl:kl+il]
    key, iv = evp(enc_key, salt)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    enc = cipher.encryptor()
    encrypted = enc.update(padded) + enc.finalize()
    return base64.b64encode(b"Salted__" + salt + encrypted).decode()

def pg_exec(sql):
    r = subprocess.run(
        ["docker", "exec", "03-system-postgres-1", "psql", "-U", "coprem", "-d", "coprem", "-t", "-c", sql],
        capture_output=True, text=True
    )
    return r.stdout.strip(), r.returncode

def main():
    env = load_env()
    enc_key = env["N8N_ENCRYPTION_KEY"]
    pg_pass = env["POSTGRES_PASSWORD"]

    # Both n8n Postgres credentials must match current password
    creds = {
        "226PbeVgki0neEi4": {"host": "postgres", "database": "coprem_os", "user": "coprem", "password": pg_pass},
        "rdxzBrj9putuOkku": {"host": "postgres", "database": "coprem_os", "user": "coprem", "password": pg_pass},
    }

    ok = True
    for cred_id, data in creds.items():
        encrypted = encrypt(data, enc_key)
        out, rc = pg_exec(f"UPDATE credentials_entity SET data = '{encrypted}' WHERE id = '{cred_id}';")
        if "UPDATE 1" in out:
            print(f"[fix_credentials] {cred_id}: ✅ synced")
        elif "UPDATE 0" in out:
            print(f"[fix_credentials] {cred_id}: ⚠️  not found (skip)")
        else:
            print(f"[fix_credentials] {cred_id}: ❌ {out}")
            ok = False

    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
