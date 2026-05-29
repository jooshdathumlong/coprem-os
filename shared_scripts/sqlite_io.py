#!/usr/bin/env python3
"""
sqlite_io.py — Coprem Local SQLite Data Warehouse
-----------------------------------------------------
Agents read/write structured data to a local SQLite database.
NocoDB can be pointed at this same .db file for a visual spreadsheet UI.

HITL Protocol: Write operations (INSERT, UPDATE, DELETE) via `run_command`
only execute after the user has typed "Approved".

Schema:
  - outputs       (id, type, agent, title, content, status, created_at)
  - tasks         (id, name, assigned_to, status, priority, due_date, notes)
  - contacts      (id, name, email, platform, tags, last_updated)
  - intel         (id, topic, source_url, summary, sentiment, created_at)

Usage:
  python3 sqlite_io.py init
  python3 sqlite_io.py read   outputs
  python3 sqlite_io.py insert outputs '{"type":"plan","agent":"marco","title":"Q3 Campaign","content":"...","status":"draft"}'
  python3 sqlite_io.py query  "SELECT * FROM outputs WHERE status='approved'"
"""

import os
import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import argparse

# Base paths
BASE_DIR = Path(__file__).parents[1]
DB_PATH = None # Will be set by argparse

def set_db_path(vault_name):
    global DB_PATH
    load_dotenv(dotenv_path=BASE_DIR / vault_name / ".env.vault")
    DB_PATH = os.getenv("SQLITE_DB_PATH", str(BASE_DIR / vault_name / "system/db/Coprem.db"))


def get_connection():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)


def init_schema():
    """Initialize the database schema (idempotent)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS outputs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            agent TEXT,
            title TEXT,
            content TEXT,
            status TEXT DEFAULT 'draft',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            assigned_to TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            due_date TEXT,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            platform TEXT,
            tags TEXT,
            last_updated TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS intel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT,
            source_url TEXT,
            summary TEXT,
            sentiment TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS okrs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project TEXT,
            objective TEXT,
            key_result TEXT,
            target_value REAL,
            current_value REAL,
            unit TEXT,
            status TEXT DEFAULT 'on_track',
            last_updated TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER,
            title TEXT,
            content TEXT,
            status TEXT DEFAULT 'active',
            last_updated TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS milestones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            okr_id INTEGER,
            month TEXT,
            title TEXT,
            target_metric REAL,
            current_metric REAL,
            status TEXT DEFAULT 'pending',
            last_updated TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (okr_id) REFERENCES okrs(id)
        );

        CREATE TABLE IF NOT EXISTS daily_checklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            milestone_id INTEGER,
            date TEXT,
            task_name TEXT,
            assigned_agent TEXT,
            status TEXT DEFAULT 'pending',
            output_id INTEGER,
            last_updated TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (milestone_id) REFERENCES milestones(id),
            FOREIGN KEY (output_id) REFERENCES outputs(id)
        );

        CREATE TABLE IF NOT EXISTS automated_trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trade_id TEXT UNIQUE,
            ticket_id TEXT,
            open_time TEXT,
            close_time TEXT,
            asset TEXT,
            direction TEXT,
            size REAL,
            risk_amount REAL,
            profit_loss REAL,
            r_multiple REAL,
            last_updated TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS knowledge_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file TEXT,
            chunk_index INTEGER,
            content TEXT,
            embedding_id TEXT,
            tags TEXT,
            last_updated TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()
    return "[OK] Schema initialized. NocoDB can now connect to: " + DB_PATH


def read_table(table: str):
    """Fetch all rows from a table."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table} ORDER BY id DESC LIMIT 50")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    conn.close()
    return [dict(zip(cols, row)) for row in rows]


def insert_row(table: str, data: dict):
    """Insert a new row into a table."""
    cols = ", ".join(data.keys())
    placeholders = ", ".join(["?" for _ in data])
    values = list(data.values())
    conn = get_connection()
    conn.execute(f"INSERT INTO {table} ({cols}) VALUES ({placeholders})", values)
    conn.commit()
    conn.close()
    return f"[OK] Inserted into `{table}`"


def run_query(sql: str):
    """Run a raw SELECT query."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    conn.close()
    return [dict(zip(cols, row)) for row in rows]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Coprem SQLite IO")
    parser.add_argument('--vault', choices=['English', 'Thai'], required=True, help="Which vault to operate on")
    parser.add_argument('action', choices=['init', 'read', 'insert', 'query'], help="Action to perform")
    parser.add_argument('args', nargs=argparse.REMAINDER, help="Additional arguments")
    args = parser.parse_args()

    set_db_path(args.vault)
    action = args.action.lower()
    sys_args = args.args

    if action == "init":
        print(init_schema())
    elif action == "read" and len(sys_args) >= 1:
        rows = read_table(sys_args[0])
        print(json.dumps(rows, indent=2, ensure_ascii=False))
    elif action == "insert" and len(sys_args) >= 2:
        data = json.loads(sys_args[1])
        print(insert_row(sys_args[0], data))
    elif action == "query" and len(sys_args) >= 1:
        rows = run_query(sys_args[0])
        print(json.dumps(rows, indent=2, ensure_ascii=False))
    else:
        print("Invalid arguments.")
        sys.exit(1)
