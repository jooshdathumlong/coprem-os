# Changelog

All notable changes to the Coprem project will be documented in this file.

## [2.0.0] - 2026-05-29

### Added
- **Version Control & History:** Initialized Git repository to track file history and versioning explicitly.
- **Versioning Standards:** Added `VERSION.md` and `CHANGELOG.md` to establish a clear version tracking system.
- **Thai Dashboard Mirroring:** Reconstructed the Dual-Vault architecture with a full Thai language mirror (`Thai/`) for the human-readable dashboard, ensuring absolute data isolation from the English backend (`English/`).
- **Compiled Context Updating:** Enhanced `sync_daemon.py` to auto-compile the Master Context (`Coprem_All_Data_Context.md`) and stamp it with the current version from `VERSION.md`.

### Changed
- **System Architecture (The Twin Pillars):** Upgraded to a strict Objective-Driven Autonomous Matrix (10 pillars) via JSON-based tool delegation. Eliminated the 35 conversational personas to drastically reduce context overhead.
- **Master Lean Blueprint:** Transitioned to a No-Middleman Direct API Architecture (Lean/OSS), eliminating SaaS middleware.
- **Database & Storage (SSOT):** Enforced SQLite (`Coprem.db`) as the absolute Single Source of Truth for OKRs and states. Markdown files are strictly read-only exports for human review.

### Security
- **HITL Verification Protocol:** Implemented a Hard-In-The-Loop protocol requiring Prem's explicit `Approved` command before executing destructive, writing, or broadcasting tasks.
