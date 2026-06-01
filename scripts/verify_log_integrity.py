#!/usr/bin/env python3
"""COPREM Log Integrity Verifier — ตรวจ hash chain ของ audit_log"""

import sys
import hashlib
import subprocess

CONTAINER = "03-system-postgres-1"
DB_USER = "coprem"
DB_NAME = "coprem_os"

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 1000


def query(sql):
    cmd = ["docker", "exec", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
           "-t", "-A", "-F", "\t", "-c", sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return [r.split("\t") for r in result.stdout.strip().split("\n") if r.strip()]


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def main():
    print(f"\nCOPREM Log Integrity Verifier (last {LIMIT} rows)")
    print("=" * 50)

    rows = query(f"""
        SELECT id, event_type, source, timestamp, prev_hash, row_hash
        FROM audit_log ORDER BY id ASC
        LIMIT {LIMIT}
    """)

    if not rows or not rows[0][0]:
        print("No rows found.")
        return

    errors = 0
    prev_hash = "genesis"

    for row in rows:
        rid, event_type, source, ts, stored_prev, stored_hash = row
        expected_hash = sha256(prev_hash + rid + (event_type or '') + (source or '') + ts)

        if stored_hash != expected_hash:
            print(f"❌ TAMPER DETECTED row id={rid}: expected={expected_hash[:16]} got={stored_hash[:16]}")
            errors += 1

        prev_hash = stored_hash

    total = len(rows)
    if errors == 0:
        print(f"✅ Chain intact — {total} rows verified, 0 errors")
    else:
        print(f"\n⚠️  {errors}/{total} rows FAILED integrity check")

    print()
    return errors


if __name__ == "__main__":
    code = main()
    sys.exit(0 if code == 0 else 1)
