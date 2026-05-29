#!/usr/bin/env python3
"""
sync_daemon.py — Coprem English↔Thai Vault Mirror
===================================================
Auto-detects new/modified files in English/ and creates/updates Thai/ mirror.

Modes:
  --mode check   : Print diff only, no changes (default)
  --mode sync    : Create missing files + update stale files in Thai/
  --mode watch   : Continuously watch for changes (runs every 60s)
  --mode clean   : Remove deprecated files in Thai/ not present in English/

Usage:
  python3 scripts/sync_daemon.py --mode check
  python3 scripts/sync_daemon.py --mode sync
  python3 scripts/sync_daemon.py --mode watch --interval 60
"""

import os
import sys
import time
import shutil
import argparse
import re
from pathlib import Path
from datetime import datetime

# ─── CONFIG ───────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parents[1]
ENG_VAULT = BASE_DIR / "English"
THAI_VAULT = BASE_DIR / "Thai"

# Files/dirs to skip entirely (relative to vault root)
SKIP_PATTERNS = [
    ".obsidian",
    ".DS_Store",
    "outputs",           # Generated outputs — not mirrored
    ".archived",
]

# Files that are Thai-specific (never auto-delete even if not in English)
THAI_ONLY_FILES = [
    "คุมบังเหียน.md",
]

# Translation map: English UI labels → Thai (for header replacement)
LABEL_MAP = {
    "Status": "สถานะ",
    "Date": "วันที่",
    "Agent": "เอเจนต์",
    "Project": "โปรเจกต์",
    "Target": "เป้าหมาย",
    "Current": "ปัจจุบัน",
    "Progress": "ความคืบหน้า",
    "Pending": "รอดำเนินการ",
    "Completed": "เสร็จแล้ว",
    "On Track": "ตามแผน",
    "Active": "ทำงานอยู่",
    "Standby": "รอ",
    "Synced": "ซิงค์แล้ว",
    "Live": "ทำงานจริง",
    "Last Sync": "ซิงค์ล่าสุด",
    "Daily Checklist": "รายการตรวจสอบประจำวัน",
    "OKR Scoreboard": "สรุป OKR",
    "Agent Status": "สถานะเอเจนต์",
    "Cloud Sync": "ซิงค์คลาวด์",
    "System Links": "ลิงก์ระบบ",
}


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def should_skip(path: Path) -> bool:
    parts = str(path).split(os.sep)
    return any(skip in parts for skip in SKIP_PATTERNS)


def get_all_md_files(vault: Path) -> dict[str, Path]:
    """Return {relative_path_str: absolute_path} for all .md files in vault."""
    result = {}
    for p in vault.rglob("*.md"):
        if not should_skip(p):
            rel = str(p.relative_to(vault))
            result[rel] = p
    return result


def apply_thai_labels(content: str) -> str:
    """Lightly translate table headers and status labels to Thai."""
    for eng, thai in LABEL_MAP.items():
        content = re.sub(r'\b' + re.escape(eng) + r'\b', thai, content)
    return content


def add_thai_header(content: str, source_rel: str, synced_at: str) -> str:
    """Prepend a Thai sync notice at the top of the file."""
    notice = (
        f"> **[ภาษาไทย — มิเรอร์อัตโนมัติ]**\n"
        f"> ไฟล์ต้นฉบับ: `English/{source_rel}` | อัพเดตล่าสุด: {synced_at}\n"
        f"> ห้ามแก้ไฟล์นี้โดยตรง — แก้ที่ English แล้วรัน sync_daemon\n\n"
    )
    # Don't add duplicate notice
    if "[ภาษาไทย — มิเรอร์อัตโนมัติ]" in content:
        # Update timestamp only
        content = re.sub(
            r'ไฟล์ต้นฉบับ:.*?\n',
            f'ไฟล์ต้นฉบับ: `English/{source_rel}` | อัพเดตล่าสุด: {synced_at}\n',
            content
        )
        return content
    return notice + content


def create_thai_mirror(eng_path: Path, thai_path: Path, rel: str, dry_run: bool = False) -> str:
    """Create or update a Thai mirror file from its English source."""
    content = eng_path.read_text(encoding="utf-8")
    synced_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Apply light Thai translation
    content = apply_thai_labels(content)
    content = add_thai_header(content, rel, synced_at)

    if not dry_run:
        thai_path.parent.mkdir(parents=True, exist_ok=True)
        thai_path.write_text(content, encoding="utf-8")

    return content


def is_stale(eng_path: Path, thai_path: Path) -> bool:
    """True if Thai file is older than English file."""
    if not thai_path.exists():
        return True
    return eng_path.stat().st_mtime > thai_path.stat().st_mtime


# ─── MODES ────────────────────────────────────────────────────────────────────

def mode_check(verbose: bool = True) -> dict:
    eng_files = get_all_md_files(ENG_VAULT)
    thai_files = get_all_md_files(THAI_VAULT)

    missing = []
    stale = []
    thai_only = []

    for rel, eng_path in sorted(eng_files.items()):
        thai_path = THAI_VAULT / rel
        if rel not in thai_files:
            missing.append(rel)
        elif is_stale(eng_path, thai_path):
            stale.append(rel)

    for rel in thai_files:
        if rel not in eng_files and rel not in THAI_ONLY_FILES:
            thai_only.append(rel)

    if verbose:
        print(f"\n{'━'*50}")
        print(f"COPREM VAULT SYNC CHECK — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print(f"{'━'*50}")
        print(f"  English files : {len(eng_files)}")
        print(f"  Thai files    : {len(thai_files)}")
        print(f"\n❌ Missing in Thai ({len(missing)}):")
        for f in missing: print(f"     {f}")
        print(f"\n⏰ Stale in Thai ({len(stale)}) — English is newer:")
        for f in stale: print(f"     {f}")
        print(f"\n⚠️  Thai-only files ({len(thai_only)}) — not in English:")
        for f in thai_only: print(f"     {f}")
        total_issues = len(missing) + len(stale)
        status = "✅ IN SYNC" if total_issues == 0 else f"⚠️  {total_issues} ISSUES FOUND"
        print(f"\nStatus: {status}")
        print(f"{'━'*50}\n")

    return {"missing": missing, "stale": stale, "thai_only": thai_only}


def mode_sync(dry_run: bool = False) -> None:
    result = mode_check(verbose=False)
    missing = result["missing"]
    stale = result["stale"]

    total = len(missing) + len(stale)
    print(f"\n[*] Sync mode {'(DRY RUN) ' if dry_run else ''}— {total} files to process")

    created = 0
    updated = 0

    for rel in missing:
        eng_path = ENG_VAULT / rel
        thai_path = THAI_VAULT / rel
        print(f"  [+] Creating: Thai/{rel}")
        create_thai_mirror(eng_path, thai_path, rel, dry_run=dry_run)
        created += 1

    for rel in stale:
        eng_path = ENG_VAULT / rel
        thai_path = THAI_VAULT / rel
        print(f"  [↻] Updating: Thai/{rel}")
        create_thai_mirror(eng_path, thai_path, rel, dry_run=dry_run)
        updated += 1

    print(f"\n✅ Done — Created: {created}, Updated: {updated}")


def mode_clean(dry_run: bool = False) -> None:
    result = mode_check(verbose=False)
    thai_only = result["thai_only"]

    print(f"\n[*] Clean mode {'(DRY RUN) ' if dry_run else ''}— {len(thai_only)} orphan files")

    for rel in thai_only:
        thai_path = THAI_VAULT / rel
        print(f"  [🗑] Removing: Thai/{rel}")
        if not dry_run:
            thai_path.unlink(missing_ok=True)

    print(f"\n✅ Cleaned {len(thai_only)} orphan files")


def mode_watch(interval: int = 60) -> None:
    print(f"\n[*] Watch mode — checking every {interval}s (Ctrl+C to stop)\n")
    try:
        while True:
            result = mode_check(verbose=False)
            total = len(result["missing"]) + len(result["stale"])
            timestamp = datetime.now().strftime("%H:%M:%S")
            if total > 0:
                print(f"[{timestamp}] ⚠️  {total} out-of-sync files — auto-syncing...")
                mode_sync(dry_run=False)
            else:
                print(f"[{timestamp}] ✅ Thai vault in sync with English")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[*] Watch mode stopped.")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Coprem English↔Thai Vault Sync Daemon")
    parser.add_argument("--mode", choices=["check", "sync", "watch", "clean"],
                        default="check", help="Operation mode (default: check)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview actions without making changes (sync/clean only)")
    parser.add_argument("--interval", type=int, default=60,
                        help="Watch interval in seconds (watch mode only, default: 60)")
    args = parser.parse_args()

    if not ENG_VAULT.exists():
        print(f"[ERROR] English vault not found: {ENG_VAULT}")
        sys.exit(1)
    if not THAI_VAULT.exists():
        print(f"[ERROR] Thai vault not found: {THAI_VAULT}")
        sys.exit(1)

    if args.mode == "check":
        mode_check(verbose=True)
    elif args.mode == "sync":
        mode_check(verbose=True)
        mode_sync(dry_run=args.dry_run)
    elif args.mode == "clean":
        mode_clean(dry_run=args.dry_run)
    elif args.mode == "watch":
        mode_watch(interval=args.interval)


if __name__ == "__main__":
    main()
