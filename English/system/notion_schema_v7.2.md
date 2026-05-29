# 🗄️ Coprem OS v7.2 — Notion Database Schema
> สร้าง 8 databases นี้ใน Notion Workspace ตามลำดับ
> ทุก field ที่ระบุ → สร้างเป็น Notion property ตาม type ที่กำหนด

---

## 1. Inbox Log

| Property | Type | Values / Notes |
|---|---|---|
| ID | Title | Format: `INX-YYYYMMDDNN` |
| Timestamp | Date | Include time |
| Source | Select | LINE, Drive, Webhook, Gmail, Folder |
| Domain | Select | business, creative, wealth, routine |
| Pillar | Select | job, personal |
| Urgency | Select | critical, high, normal, low |
| Assigned_To | Select | jeff, eilinaire_agent, ego_era_agent |
| Status | Select | pending, processing, done, rejected, auto-rejected |
| Sanitized | Checkbox | ✅ = ผ่าน sanitizer แล้ว |

---

## 2. Task Board (Daily Checklist)

| Property | Type | Values / Notes |
|---|---|---|
| Task | Title | คำอธิบายงาน |
| Project | Select | Eilinaire, Peabuntid, Trading, EGO ERA, Music, Job |
| Agent | Select | jeff, eilinaire_agent, ego_era_agent |
| Status | Select | ⏳ Pending, 🔄 In Progress, ✅ Done, ❌ Rejected |
| Due_Date | Date | วันที่ deadline |
| Priority | Select | 🔴 Critical, 🟠 High, 🟡 Normal, 🟢 Low |
| HITL_Status | Select | Not Required, Pending, Approved, Rejected, Timeout |
| Output_Link | URL | Link ไปยัง output file หรือ Notion page |

---

## 3. OKR Scoreboard

| Property | Type | Values / Notes |
|---|---|---|
| ID | Title | Format: `OKR-[PROJECT]-NN` |
| Project | Select | Eilinaire, Peabuntid, Trading, EGO ERA, Music, Job |
| Objective | Text | คำอธิบาย Objective |
| Key_Result | Text | คำอธิบาย Key Result |
| Current | Number | ค่าปัจจุบัน |
| Target | Number | ค่าเป้าหมาย |
| Unit | Text | sign-ups, entries, trades, chapters, etc. |
| Status | Select | 🟢 On Track, 🟡 At Risk, 🔴 Behind, ✅ Complete |
| Last_Updated | Date | วันที่อัปเดตล่าสุด |

---

## 4. Decision Memory Log (L5 Mirror)

| Property | Type | Values / Notes |
|---|---|---|
| Decision_ID | Title | Format: `DEC-YYYYMMDDNN` |
| Task_Type | Select | marketing_content, trade_validation, creative_draft, etc. |
| Decision | Select | approved, rejected |
| Rule_Extracted | Text | กฎที่ระบบเรียนรู้ (English) |
| Confidence | Number | 0.00 – 1.00 |
| Status | Select | active, archived |
| Superseded_By | Text | Decision_ID ที่แทนที่ (ถ้ามี) |
| Outcome | Select | success, failure, unknown |
| Outcome_Date | Date | วันที่รู้ผลลัพธ์ |
| Prompt_Version | Text | เช่น jeff-v1.0, eilinaire-v1.2 |
| Domain | Select | business, creative, wealth, routine |
| Agent | Select | jeff, eilinaire_agent, ego_era_agent |

---

## 5. Trade Journal

| Property | Type | Values / Notes |
|---|---|---|
| ID | Title | Format: `TRD-YYYYMMDDNN` |
| Date | Date | วันที่เทรด |
| Symbol | Text | เช่น XAUUSD, SET50 |
| Direction | Select | Long, Short |
| Size_Pct | Number | % ของ account (max 1%) |
| Entry | Number | ราคา entry |
| Exit | Number | ราคา exit (ถ้าปิดแล้ว) |
| PnL | Number | กำไร/ขาดทุน (%) |
| DD_Pct | Number | Drawdown ณ ขณะนั้น (%) |
| Compliance | Checkbox | ✅ = ผ่าน risk rules |
| Chart_Link | URL | Link ไปยัง TradingView chart |

---

## 6. Market Signal Log

| Property | Type | Values / Notes |
|---|---|---|
| ID | Title | Format: `MKT-YYYYMMDDNN` |
| Date | Date | วันที่ตรวจพบ |
| Keyword | Text | คำที่ spike |
| Spike_Pct | Number | % การเพิ่มขึ้น |
| Domain | Select | business, creative, wealth |
| Action_Proposed | Text | สิ่งที่ระบบแนะนำ (Thai) |
| Prem_Response | Select | Approved, Rejected, Ignored, Pending |

---

## 7. Failed Tasks DB (Dead Letter Queue)

| Property | Type | Values / Notes |
|---|---|---|
| Task_ID | Title | อ้างอิงจาก Inbox Log ID |
| Workflow | Select | WF1-Inbox, WF2-Brief, WF3-Pulse, WF4-OKR, WF5-HITL, WF6-Ping |
| Error_Message | Text | ข้อความ error จาก n8n |
| Timestamp | Date | วันเวลาที่เกิด error |
| Status | Select | Unresolved, Retried, Resolved, Abandoned |

---

## 8. Quarantine DB (Schema Violations)

| Property | Type | Values / Notes |
|---|---|---|
| Task_ID | Title | อ้างอิงจาก Inbox Log ID |
| Raw_Output | Text | Output ดิบที่ผิด schema จาก Agent |
| Schema_Error | Text | คำอธิบายว่าผิดตรงไหน |
| Timestamp | Date | วันเวลาที่เกิด |

---

> **หมายเหตุ:** ทุก database ให้ตั้งชื่อตรงตามที่ระบุ — n8n nodes จะ reference ชื่อเหล่านี้
