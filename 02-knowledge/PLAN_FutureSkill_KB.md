## PLAN: FutureSkill Knowledge Base Integration
Status: PENDING — do not execute until Prem says go

Source:
- CSV: Futureskill/FutureSkill_All_584 - Sheet1.csv (584 courses: No., Course Name, URL)
- ZIP: Futureskill/*.zip (contains PDF notes/slides per course)

---

## PHASE 1 — Postgres Table (Search layer)

Goal: Jeff สามารถ query หาคอร์สได้จาก script/SQL

Steps:
1. Create table `futureskill_courses` in Postgres
   ```sql
   CREATE TABLE futureskill_courses (
     id SERIAL PRIMARY KEY,
     no INTEGER,
     course_name TEXT,
     url TEXT,
     category TEXT,
     has_pdf BOOLEAN DEFAULT FALSE,
     pdf_summary TEXT
   );
   ```
2. Write `scripts/import_futureskill_csv.py` → parse CSV → INSERT rows
3. Auto-categorize by keyword in course name (AI, Excel, Marketing, Programming, HR, etc.)
4. Mark `has_pdf = TRUE` for courses that have a matching ZIP in the folder
5. Verify: `SELECT category, COUNT(*) FROM futureskill_courses GROUP BY category;`

---

## PHASE 2 — Markdown KB File (Human-readable layer)

Goal: เปรมเปิดอ่านได้ มีหมวดหมู่ชัดเจน

Steps:
1. Generate `02-knowledge/KB-06_FutureSkill_Courses.md`
2. Structure:
   ```
   ## SECTION: AI & Data
   | # | คอร์ส | PDF? | ลิงก์ |
   
   ## SECTION: Programming
   ...
   
   ## SECTION: Marketing
   ...
   
   ## SECTION: HR & Management
   ...
   
   ## SECTION: Office Tools (Excel, Office 365)
   ...
   
   ## SECTION: Other
   ...
   ```
3. Source from Postgres (Phase 1 must complete first)
4. Register in INDEX.md

---

## PHASE 3 — PDF Extraction (Content layer)

Goal: ดึงเนื้อหา PDF มาใส่ `pdf_summary` ใน Postgres + ใส่ใน KB file

Steps:
1. Write `scripts/extract_futureskill_pdfs.py`
   - unzip each ZIP into `Futureskill/extracted/[course_name]/`
   - find *.pdf → extract text with `pdfplumber` or `pymupdf`
   - summarize with LLM (LiteLLM) → store in `pdf_summary` column
   - self-delete extracted folder after ingestion
2. Dependency: pdfplumber or pymupdf must be pip-installed

---

## PHASE 4 — Dify Knowledge Base (Chat layer)

Goal: เปรมถามผ่าน Telegram ว่า "มีคอร์ส AI อะไรบ้าง?" ได้เลย

Steps:
1. Export KB-06 markdown → upload to Dify as Knowledge Base "FutureSkill"
2. Wire to existing Dify agent
3. Test query: "แนะนำคอร์ส Excel สำหรับนักบัญชี"

---

## Execution Order

Phase 1 → Phase 2 → Phase 3 → Phase 4
(Each phase can ship independently — Prem can stop at any phase)

## DICE Score
D=3 (blocks Dify KB + Telegram search) | I=3 (personal upskill asset) | C=2 (low, mostly scripts)
Score = 4 → queue (do after Month 3 P1/P2 complete)

## Dependencies
- pdfplumber or pymupdf (pip install)
- LiteLLM running (for PDF summary — optional, can skip)
- Dify API key (for Phase 4)

## ROLLBACK
- Drop table: `DROP TABLE futureskill_courses;`
- Delete KB file: rm 02-knowledge/KB-06_FutureSkill_Courses.md
- Dify: delete Knowledge Base from UI
