#!/usr/bin/env python3
"""
obsidian_io.py — Coprem Local Obsidian Vault Interface
---------------------------------------------------------
Reads and writes .md files directly to the local Obsidian vault.
No API required. Runs entirely on local file system.

HITL Protocol: This script executes write operations only via `run_command`
after the user has explicitly typed "Approved" on the executive report.

Usage:
  python3 obsidian_io.py read  "relative/path/note.md"
  python3 obsidian_io.py write "relative/path/note.md" "content here"
  python3 obsidian_io.py list  "relative/folder/"
"""

import os
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load credentials from vault
load_dotenv(dotenv_path=Path(__file__).parents[2] / ".env.vault")
VAULT_PATH = Path(os.getenv("OBSIDIAN_VAULT_PATH", ""))


def read_note(relative_path: str) -> str:
    """Read a specific note from the Obsidian vault."""
    target = VAULT_PATH / relative_path
    if not target.exists():
        return f"[ERROR] Note not found: {target}"
    return target.read_text(encoding="utf-8")


def write_note(relative_path: str, content: str) -> str:
    """Write or overwrite a note in the Obsidian vault."""
    target = VAULT_PATH / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    full_content = f"<!-- Last updated by Coprem: {timestamp} -->\n\n{content}"
    target.write_text(full_content, encoding="utf-8")
    return f"[OK] Written to: {target}"


def list_notes(relative_folder: str = "") -> list:
    """List all .md files in a subfolder of the vault."""
    folder = VAULT_PATH / relative_folder
    return [str(p.relative_to(VAULT_PATH)) for p in folder.rglob("*.md")]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: obsidian_io.py [read|write|list] [path] [content]")
        sys.exit(1)

    action = sys.argv[1].lower()

    if action == "read" and len(sys.argv) >= 3:
        print(read_note(sys.argv[2]))
    elif action == "write" and len(sys.argv) >= 4:
        print(write_note(sys.argv[2], sys.argv[3]))
    elif action == "list":
        folder = sys.argv[2] if len(sys.argv) >= 3 else ""
        notes = list_notes(folder)
        print("\n".join(notes))
    else:
        print("Invalid arguments.")
        sys.exit(1)
