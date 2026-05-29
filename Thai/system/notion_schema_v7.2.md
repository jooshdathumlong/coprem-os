> **[ภาษาไทย — มิเรอร์อัตโนมัติ]**
> ไฟล์ต้นฉบับ: `English/system/notion_schema_v7.2.md` | อัพเดตล่าสุด: 2026-05-30 04:32
> ห้ามแก้ไฟล์นี้โดยตรง — แก้ที่ English แล้วรัน sync_daemon

# 🗄️ Coprem OS v7.2 — Notion Database Schema
> สร้าง 8 databases นี้ใน Notion Workspace ตามลำดับ
> ทุก field ที่ระบุ → สร้างเป็น Notion property ตาม type ที่กำหนด

---

## 1. Inbox Log

| Property | Type | Values / Notes |
|---|---|---|
| ID | Title | Format: `INX-YYYYMMDDNN` |
| Timestamp | วันที่ | Include time |
| Source | Select | LINE, Drive, Webhook, Gmail, Folder |
| Domain | Select | business, creative, wealth, routine |
| Pillar | Select | job, personal |
| Urgency | Select | critical, high, normal, low |
| Assigned_To | Select | jeff, eilinaire_agent, ego_era_agent |
| สถานะ | Select | pending, processing, done, rejected, auto-rejected |
| Sanitized | Checkbox | ✅ = ผ่าน sanitizer แล้ว |

---

## 2. Task Board (รายการตรวจสอบประจำวัน)

| Property | Type | Values / Notes |
|---|---|---|
| Task | Title | คำอธิบายงาน |
| โปรเจกต์ | Select | Eilinaire, Peabuntid, Trading, EGO ERA, Music, Job |
| เอเจนต์ | Select | jeff, eilinaire_agent, ego_era_agent |
| สถานะ | Select | ⏳ รอดำเนินการ, 🔄 In ความคืบหน้า, ✅ Done, ❌ Rejected |
| Due_Date | วันที่ | วันที่ deadline |
| Priority | Select | 🔴 Critical, 🟠 High, 🟡 Normal, 🟢 Low |
| HITL_Status | Select | Not Required, รอดำเนินการ, Approved, Rejected, Timeout |
| Output_Link | URL | Link ไปยัง output file หรือ Notion page |

---

## 3. สรุป OKR

| Property | Type | Values / Notes |
|---|---|---|
| ID | Title | Format: `OKR-[PROJECT]-NN` |
| โปรเจกต์ | Select | Eilinaire, Peabuntid, Trading, EGO ERA, Music, Job |
| Objective | Text | คำอธิบาย Objective |
| Key_Result | Text | คำอธิบาย Key Result |
| ปัจจุบัน | Number | ค่าปัจจุบัน |
| เป้าหมาย | Number | ค่าเป้าหมาย |
| Unit | Text | sign-ups, entries, trades, chapters, etc. |
| สถานะ | Select | 🟢 ตามแผน, 🟡 At Risk, 🔴 Behind, ✅ Complete |
| Last_Updated | วันที่ | วันที่อัปเดตล่าสุด |

---

## 4. Decision Memory Log (L5 Mirror)

| Property | Type | Values / Notes |
|---|---|---|
| Decision_ID | Title | Format: `DEC-YYYYMMDDNN` |
| Task_Type | Select | marketing_content, trade_validation, creative_draft, etc. |
| Decision | Select | approved, rejected |
| Rule_Extracted | Text | กฎที่ระบบเรียนรู้ (English) |
| Confidence | Number | 0.00 – 1.00 |
| สถานะ | Select | active, archived |
| Superseded_By | Text | Decision_ID ที่แทนที่ (ถ้ามี) |
| Outcome | Select | success, failure, unknown |
| Outcome_Date | วันที่ | วันที่รู้ผลลัพธ์ |
| Prompt_Version | Text | เช่น jeff-v1.0, eilinaire-v1.2 |
| Domain | Select | business, creative, wealth, routine |
| เอเจนต์ | Select | jeff, eilinaire_agent, ego_era_agent |

---

## 5. Trade Journal

| Property | Type | Values / Notes |
|---|---|---|
| ID | Title | Format: `TRD-YYYYMMDDNN` |
| วันที่ | วันที่ | วันที่เทรด |
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
| วันที่ | วันที่ | วันที่ตรวจพบ |
| Keyword | Text | คำที่ spike |
| Spike_Pct | Number | % การเพิ่มขึ้น |
| Domain | Select | business, creative, wealth |
| Action_Proposed | Text | สิ่งที่ระบบแนะนำ (Thai) |
| Prem_Response | Select | Approved, Rejected, Ignored, รอดำเนินการ |

---

## 7. Failed Tasks DB (Dead Letter Queue)

| Property | Type | Values / Notes |
|---|---|---|
| Task_ID | Title | อ้างอิงจาก Inbox Log ID |
| Workflow | Select | WF1-Inbox, WF2-Brief, WF3-Pulse, WF4-OKR, WF5-HITL, WF6-Ping |
| Error_Message | Text | ข้อความ error จาก n8n |
| Timestamp | วันที่ | วันเวลาที่เกิด error |
| สถานะ | Select | Unresolved, Retried, Resolved, Abandoned |

---

## 8. Quarantine DB (Schema Violations)

| Property | Type | Values / Notes |
|---|---|---|
| Task_ID | Title | อ้างอิงจาก Inbox Log ID |
| Raw_Output | Text | Output ดิบที่ผิด schema จาก เอเจนต์ |
| Schema_Error | Text | คำอธิบายว่าผิดตรงไหน |
| Timestamp | วันที่ | วันเวลาที่เกิด |

---

> **หมายเหตุ:** ทุก database ให้ตั้งชื่อตรงตามที่ระบุ — n8n nodes จะ reference ชื่อเหล่านี้
