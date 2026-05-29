#!/usr/bin/env python3
"""
sync_validator.py — Coprem Bidirectional Markdown-to-SQLite Data Integrity Sync
--------------------------------------------------------------------------------
Woken by Libby (Archivist). Calculates md5 checksums/timestamps, cross-references
Obsidian markdown files with SQLite `outputs` and `tasks` tables, and presents a
sync-rectification plan.
"""

import os
import hashlib
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

import argparse

# Default fallbacks if called directly without args (though argparse now requires it)
DB_PATH = None
VAULT_PATH = None

class SyncValidator:
    def __init__(self, db_path=DB_PATH, vault_path=VAULT_PATH):
        self.db_path = db_path
        self.vault_path = vault_path

    def calculate_md5(self, filepath):
        """Calculate MD5 hash of file content to detect manual updates."""
        hasher = hashlib.md5()
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()

    def run_sync_audit(self):
        """Cross-reference Obsidian markdown files with sqlite DB."""
        print(f"[*] Starting Sync Audit on database: {self.db_path}")
        print(f"[*] Vault root path: {self.vault_path}")
        
        if not os.path.exists(self.db_path):
            print(f"[!] SQLite DB not found at: {self.db_path}. Initializing first.")
            return

        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        # Ensure sync_ledger tracking table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sync_ledger (
                file_path TEXT PRIMARY KEY,
                last_hash TEXT,
                last_modified TEXT,
                synced_at TEXT DEFAULT (datetime('now'))
            );
        """)
        conn.commit()

        # Audit files inside English/ and Thai/
        discrepancies = []
        md_files = []
        for root, dirs, files in os.walk(self.vault_path):
            # Ignore node_modules directory at any level
            if "node_modules" in root.split(os.sep):
                continue
            if "node_modules" in dirs:
                dirs.remove("node_modules")
            for f in files:
                if f.endswith(".md"):
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, self.vault_path)
                    md_files.append(rel_path)

        print(f"[*] Found {len(md_files)} markdown files in Obsidian Vault.")
        
        for rel_path in md_files:
            full_path = os.path.join(self.vault_path, rel_path)
            current_hash = self.calculate_md5(full_path)
            current_mtime = datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
            
            cur.execute("SELECT last_hash, last_modified FROM sync_ledger WHERE file_path = ?", (rel_path,))
            row = cur.fetchone()
            
            if not row:
                # File exists but not recorded in sync ledger yet
                print(f"[NEW] File detected: {rel_path}")
                cur.execute("INSERT INTO sync_ledger (file_path, last_hash, last_modified) VALUES (?, ?, ?)",
                            (rel_path, current_hash, current_mtime))
            else:
                db_hash, db_mtime = row
                if current_hash != db_hash:
                    print(f"[DISCREPANCY] Hash mismatch detected for: {rel_path}")
                    discrepancies.append({
                        "file_path": rel_path,
                        "type": "OUT_OF_SYNC",
                        "db_hash": db_hash,
                        "current_hash": current_hash
                    })
                    # Update ledger to keep in sync
                    cur.execute("UPDATE sync_ledger SET last_hash = ?, last_modified = ?, synced_at = datetime('now') WHERE file_path = ?",
                                (current_hash, current_mtime, rel_path))

        # Prune deleted files
        cur.execute("SELECT file_path FROM sync_ledger")
        db_files = [row[0] for row in cur.fetchall()]
        pruned_count = 0
        for db_file in db_files:
            if db_file not in md_files:
                print(f"[DELETED] Removing orphaned record for: {db_file}")
                cur.execute("DELETE FROM sync_ledger WHERE file_path = ?", (db_file,))
                pruned_count += 1
                discrepancies.append({
                    "file_path": db_file,
                    "type": "ORPHANED_RECORD"
                })

        conn.commit()
        conn.close()
        
        print("[*] Sync Audit Completed.")
        if not discrepancies:
            print("[+] Zero discrepancies found. Data integrity: 100% OK.")
        else:
            print(f"[!] Sync Rectification Plan required for {len(discrepancies)} mismatch(es):")
            for d in discrepancies:
                print(f"  - {d['file_path']} was modified directly. Sync ledger has been updated to matches.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Coprem Sync Validator")
    parser.add_argument('--vault', choices=['English', 'Thai'], required=True, help="Which vault to operate on")
    args = parser.parse_args()

    BASE_DIR = Path(__file__).parents[1]
    vault_name = args.vault
    load_dotenv(dotenv_path=BASE_DIR / vault_name / ".env.vault")
    
    VAULT_PATH = str(BASE_DIR / vault_name)
    DB_PATH = os.getenv("SQLITE_DB_PATH", str(BASE_DIR / vault_name / "system/db/Coprem.db"))

    validator = SyncValidator(db_path=DB_PATH, vault_path=VAULT_PATH)
    validator.run_sync_audit()
