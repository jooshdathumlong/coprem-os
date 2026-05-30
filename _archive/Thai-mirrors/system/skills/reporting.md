# 🧠 Playbook: Executive OKR Dashboard Reporting

> **"Absolute visibility at the top. Zero clutter in the middle."**
> This playbook outlines the standardized formula for constructing the Executive OKR Dashboard Report.

---

## 🎯 Goal & Mandate
- **Skill Name:** Executive OKR Dashboard Report
- **What this does:** Compiles a high-impact, clean dashboard of objectives, current metrics, autonomous work completed, and pending actions needing HITL approval.
- **Who uses this:** Jeff (CEO) & Archie (COO)

---

## ⚙️ Step-by-Step Blueprint

### Step 1: Metrics Fetch
- Query the `okrs` table in `system/db/Coprem.db` or read `system/db/okrs.md` to get the latest `current_value` vs `target_value` and progress percentage.

### Step 2: Autonomous Log Extraction
- Gather achievements completed during the session (e.g. file generation, backtests, lore compilation). Only list *completed* work, not intermediate discussion.

### Step 3: HITL Action Isolation
- Isolate all pending commands that write data, call external messaging APIs, or commit financial actions. Format them as clear options with click-to-view links.

---

## 📝 Example of Success (Golden Sample)

```markdown
# 👑 Coprem Executive OKR Dashboard Report
> **Date:** 2026-05-28 | **Sprint:** Q2/Q3-90D | **Status:** 🟢 Active

---

## 📊 OKR Progress Ledger

| Project | Objective / Key Result | Target | Current | Progress | Status |
|---|---|---|---|---|---|
| **Eilinaire** | KR 1.1: Build Focus Axis GTM Funnel | 1,000 signups | 0 | 0.0% | 🟡 Pending |
| **Peabuntid** | KR 2.1: Seed Academic and Shop resources | 100 entries | 100 | 100% | 🟢 Complete |
| **Trading** | KR 3.3: Log all trades in journal | 100% | 10% | 10.0% | 🟢 On Track |

---

## 🤖 Autonomous Actions Executed (Personal Empire)
- **Ops Department:** Libby compiled 3 market summaries into `knowledge/personal/`.
- **Creative Department:** Luna structured Chapter 2 characters in `projects/ego_era/character/`.
- **DB System:** Initialized sqlite schema and verified contact registry table.

---

## ⚠️ Awaiting Executive Command (Approved / Reject)

### [ACTION 1] Publish LINE OA Broadcast
- **Script Target:** `system/scripts/line_oa_broadcast.py`
- **Arguments:** `broadcast "สวัสดีครับ ยินดีต้อนรับสู่ Peabuntid"`
- **Purpose:** Inform active contacts of platform launch.
- *Command:* **`Approved`** / **`Reject`**
```

---

## ❌ Pitfalls & What to Avoid
- **Pitfall 1:** Displaying agent-to-agent chatter. -> **Fix:** Only report the final autonomous outcomes.
- **Pitfall 2:** Executing write commands before receiving the "Approved" prompt. -> **Fix:** Always halt execution and list the action under "Awaiting Executive Command."
