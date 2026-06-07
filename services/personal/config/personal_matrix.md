# 🏛️ Personal Empire Enterprise Matrix Directory

This directory governs the corporate-style division of labor for Prem's Personal Empire (`system/personal/`). It maps **28 Personal Agents** into 10 strict functional pillars, guiding autonomous task delegation, power-center veto gates, and information routing.

---

## 🏢 1. The 10 Matrix Functional Pillars

| Pillar | Sub-Directory | Description | Active Agents |
|---|---|---|---|
| **Executive** | [executive/](file://./system/personal/executive/) | Strategic alignment, task delegation, and orchestrations. | Jeff, Archie, Luna, Finn, Marco |
| **Finance & Audit** | [finance_audit/](file://./system/personal/finance_audit/) | Prop firm challenges, capital checks, and allocations. | Zeke, Quinn, Vance |
| **Marketing** | [marketing/](file://./system/personal/marketing/) | Organic channels, brand messaging, and trends. | Mia, Noah |
| **Sales** | [sales/](file://./system/personal/sales/) | Media buying, paid acquisition, and conversion tracking. | Zane, Leo |
| **HR & Talent** | [hr/](file://./system/personal/hr/) | Performance audits, token efficiency, and agent profiles. | Grace |
| **Operations** | [operations/](file://./system/personal/operations/) | Internal databases (SQLite), knowledge index, file I/O. | Libby, Indy |
| **Production & QC** | [production_qc/](file://./system/personal/production_qc/) | Copywriting, brand guarding, factual reviews, logic gates. | Vera, Chris, Stella, Chloe |
| **Legal & Strategy** | [legal_strategy/](file://./system/personal/legal_strategy/) | Risk limits, macro-economics, trade plans check. | Sage, Nick |
| **R&D** | [research_development/](file://./system/personal/research_development/) | Deep-dive research, new concept/idea designs. | Reese, Minnie, Newy |
| **Creative** | [creative/](file://./system/personal/creative/) | Lyrics, novel plots, character behavioral designs. | Melody, Aria, Freya, Grimm |

---

## 🧬 2. Big Tech DNA Power Centers (ABSOLUTE VETO DOCTRINE)

These are non-negotiable rules that define which pillar holds **ultimate authority** over each project domain. Power Center sign-off is **mandatory** before any deliverable is presented to Prem.

### 🍎 Apple DNA — Eilinaire Brand & EGO ERA Novel
> *"Aesthetics and quality are not features. They are the product."*

- **Power Center Pillars:** `Production & QC` + `Creative`
- **Veto Agents:** Vera (Fact-Checker) • Chris (Devil's Advocate) • Stella (Brand Guardian) • Chloe (Copywriter) • Luna (Creative Director) • Grimm (Lore Master) • Freya (Character Psychologist)
- **Veto Authority:** Premium brand voice, visual/narrative consistency, and world-building integrity **TRUMP** speed, volume, and business pressure.
- **Hard Gate Rule:** Any deliverable for Eilinaire or EGO ERA that fails Brand Constitution alignment or lore consistency is **RETURNED to drafting immediately**. It does NOT reach Jeff's compilation step until the Apple Power Center explicitly signs off.

### 📊 Google / Amazon DNA — The5ers Trading & Peabuntid Platform
> *"If you cannot measure it, you cannot improve it. If it breaks risk limits, it does not exist."*

- **Power Center Pillars:** `Finance & Audit` + `Legal & Strategy`
- **Veto Agents:** Nick (Risk Manager) • Sage (Macro Economist) • Zeke (Quant Analyst) • Quinn (Portfolio Analyst) • Vance (Data/Trade Executor)
- **Veto Authority:** Mathematical data accuracy, strict risk parameters (max 1% per trade / max 10% overall drawdown), and algorithmic scalability **TRUMP** creative flair or urgency.
- **Hard Gate Rule:** Any trade plan, investment thesis, or Peabuntid data logic that violates risk limits or fails factual validation is **HARD REJECTED** before it leaves the Finance/Legal layer. No exceptions.

---

## ⛓️ 3. Matrix Chain of Custody (Task Flow Pipeline)

To achieve extreme token efficiency, the task flow runs on a strict **Minimalist & Single-Agent Activation** pipeline:

```
1. Jeff reads daily checklist (SQLite `daily_checklist`)
       ↓ Activates
2. Specific Assigned Agent (Only 1 active agent for the task)
   → Produces single targeted output (e.g. copywriting draft, quant model backtest)
       ↓ Commits Output
3. SQLite DB (Written directly to `outputs` table)
       ↓ Power Center Check (ONLY if task produces a final deliverable)
4. ── POWER CENTER GATE ──────────────────────────────────────────
   🍎 Apple Domain (Eilinaire / EGO ERA):
     Production & QC (Vera, Chris, Stella, Chloe) + Creative (Luna, Grimm, Freya)
     → Checks brand voice, lore consistency, fact accuracy, logic
   📊 Google Domain (Trading / Peabuntid):
     Finance & Audit (Zeke, Quinn, Vance) + Legal & Strategy (Nick, Sage)
     → Checks data accuracy, risk limits, mathematical validity
   ─────────────────────────────────────────────────────────────────
        ↓ Vetting Logic Gate:
        - Limit to max 2 consecutive HARD REJECT verdicts on the same task.
        - On the 3rd conflict, freeze the task, extract the logical impasse, 
          and escalate directly to the "Executive Command" on the Master Dashboard.
5. Jeff Compiles Executive OKR Dashboard Report
   → Includes Power Center Vetting Log as MANDATORY section
       ↓ HITL Screen
6. Prem — Reviews and types Approved / Reject
       ↓ Approved
7. Operations Dispatches (SQLite writes, API calls, file I/O)
```

---

## 📋 4. Mandatory Executive OKR Dashboard Template

Jeff's report MUST follow this template every run:

```markdown
# 👑 Coprem Executive OKR Dashboard Report
> Date: [DATE] | Sprint: Q2/Q3-90D | Status: 🟢 Active (Autonomous)

## 📊 OKR Progress Ledger
| Project | Key Result | Target | Current | Progress | Status |
|---|---|---|---|---|---|
...

## 🤖 Autonomous Actions Executed
- ...

## 🔏 Power Center Vetting Log (MANDATORY)
| Deliverable | Domain | Power Center Agents | Verdict | Notes |
|---|---|---|---|---|
| [Item] | 🍎 Apple / 📊 Google | [Agents who reviewed] | ✅ Signed Off / ❌ Rejected | [Reason if rejected] |

## ⚠️ Awaiting Executive Command (Approved / Reject)
1. **[ACTION TITLE]** — [Script / API to execute]
   - Purpose: [What it does]
   - Command: `Approved` / `Reject`
```
