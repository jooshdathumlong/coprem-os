# 🚀 Coprem OS v7.2 — Setup Guide
> ทำตามลำดับ | ใช้เวลา ~4 ชั่วโมง | ไม่ต้อง code แม้แต่บรรทัดเดียว

---

## ชั่วโมงที่ 1 — สมัคร Platforms + รับ API Keys

### 1.1 Dify.ai
1. เปิด [dify.ai](https://dify.ai) → Sign up (Free tier)
2. ยืนยัน email → เข้า Dashboard

### 1.2 n8n
**Option A (Cloud):** เปิด [n8n.io](https://n8n.io) → Start Free Trial
**Option B (Self-host ฟรี):**
```
npx n8n
# เปิด browser: http://localhost:5678
```

### 1.3 Notion
1. เปิด [notion.so](https://notion.so) → สร้าง account
2. สร้าง Workspace ใหม่ → ชื่อ "Coprem OS"
3. ไป Settings → Integrations → สร้าง Integration ใหม่ → ชื่อ "Coprem n8n"
4. Copy Integration Token (เก็บไว้ใช้ใน n8n)

### 1.4 LINE OA
1. เปิด [developers.line.biz](https://developers.line.biz) → Log in
2. Create Provider → ชื่อ "Coprem"
3. Create Channel → Messaging API → ชื่อ "Jeff"
4. Basic Settings → Copy: Channel Secret
5. Messaging API → Issue: Channel Access Token

### 1.5 API Keys ที่ต้องเตรียม

| Key | ดูได้ที่ | ใช้ใน |
|---|---|---|
| OpenAI API Key | platform.openai.com | Dify.ai |
| Anthropic API Key | console.anthropic.com | Dify.ai |
| Google Trends | ใช้ SerpAPI หรือ PyTrends via n8n HTTP | n8n WF2, WF3 |
| Yahoo Finance | rapidapi.com → "Yahoo Finance" | n8n WF2 |
| LINE Channel Token | LINE Developers Console | n8n |
| Gmail (backup) | Google Account → App Password | n8n |

---

## ชั่วโมงที่ 2 — สร้าง Knowledge Bases ใน Dify.ai

### ลำดับการสร้าง:

**KB-01: brand_constitution**
1. Dify.ai → Knowledge → + Create Knowledge
2. ชื่อ: `brand_constitution`
3. Upload: `English/projects/brands/eilinaire/constitution.md`
4. Upload: `English/projects/brands/peabuntid/constitution.md`
5. Settings: Embedding = `text-embedding-3-large` | Mode = Hybrid Search | Top K = 5

**KB-02: ego_era_bible**
1. ชื่อ: `ego_era_bible`
2. Upload: `English/projects/ego_era/ego_era_bible.md`
3. Upload: ทุกไฟล์ใน `English/projects/ego_era/character/`
4. Settings: เหมือน KB-01

**KB-03: trading_rules**
1. ชื่อ: `trading_rules`
2. Upload: `English/projects/trading/rules.md`
3. Settings: เหมือน KB-01

**KB-04: job_knowledge**
1. ชื่อ: `job_knowledge`
2. Upload: `English/system/job/dept_marketing.md`
3. Upload: `English/system/job/dept_ops.md`
4. Settings: เหมือน KB-01

**KB-05: decision_memory**
1. ชื่อ: `decision_memory`
2. ไม่ต้อง upload อะไร — เว้นว่างไว้
3. Settings: เหมือน KB-01 (ระบบจะเพิ่มเองผ่าน n8n WF5)

---

## ชั่วโมงที่ 3 — สร้าง Agents + Smart Router ใน Dify.ai

### 3.1 สร้าง Jeff Agent
1. Dify.ai → Studio → + Create → Agent
2. ชื่อ: `Jeff`
3. Model: Claude 3.5 Sonnet (หรือ claude-3-5-sonnet-20241022)
4. System Prompt: Copy จาก `English/system/prompts/jeff.md`
5. Knowledge: เพิ่ม KB-04 และ KB-05
6. Tools: เปิด HTTP Request, Code Interpreter
7. Memory: Enable → Window size = 20
8. Save → Publish → Copy API endpoint + API Key

### 3.2 สร้าง Eilinaire Agent
1. ชื่อ: `Eilinaire Agent`
2. Model: GPT-4o
3. System Prompt: Copy จาก `English/system/prompts/eilinaire_agent.md`
4. Knowledge: เพิ่ม KB-01, KB-03, KB-05
5. Tools: HTTP Request, Code Interpreter, Web Search
6. Save → Publish → Copy API endpoint + API Key

### 3.3 สร้าง Ego Era Agent
1. ชื่อ: `Ego Era Agent`
2. Model: Claude 3.5 Sonnet
3. System Prompt: Copy จาก `English/system/prompts/ego_era_agent.md`
4. Knowledge: เพิ่ม KB-02, KB-05
5. Tools: Code Interpreter
6. Save → Publish → Copy API endpoint + API Key

### 3.4 สร้าง Smart Router (Chatflow)
1. Dify.ai → Studio → + Create → **Chatflow**
2. ชื่อ: `Coprem Smart Router v7.2`
3. System Prompt: Copy จาก `English/system/prompts/smart_router.md`
4. Nodes ที่ต้องสร้าง (ลากตามลำดับ):
   - [Start] → [LLM: translate + classify] → [Code: sanitize]
   - [Knowledge Retrieval: KB-05] → [IF: memory match?]
   - [IF: HITL needed?] → [HTTP: n8n webhook หรือ Agent routing]
5. Save → Publish → Copy API endpoint + API Key

---

## ชั่วโมงที่ 4 — Notion + n8n + LINE

### 4.1 สร้าง Notion Databases
ทำตาม `English/system/notion_schema_v7.2.md` ทีละ database
→ Share แต่ละ database กับ Integration "Coprem n8n"
→ Copy Database ID จาก URL (32 ตัวอักษรหลัง notion.so/xxxxxxx)

### 4.2 สร้าง n8n Workflow 1 (Inbox Receiver)
1. n8n → + New Workflow → ชื่อ "WF1 — Inbox Receiver"
2. ลาก nodes ตามลำดับ:

```
[LINE Webhook]
    ↓
[IF: content.length > 0 AND type != sticker]  ← Guardrail 1
    ↓ (pass)              ↓ (fail)
[HTTP: Dify]          [LINE: "ส่งใหม่"]
Smart Router
    ↓
[IF: hitl_required == true]
    ↓ (true)              ↓ (false)
[LINE: ✋ ขออนุมัติ]   [HTTP: Dify Agent]
[Wait: 24h]               ↓
    ↓ (reply)         [LINE: รายงาน Thai]
[Parse reply]         [Notion: update]
    ↓ (timeout)
[Notion: Auto-Rejected]
[LINE: แจ้ง]

[Error Trigger: ทุก node] → [LINE: 🔴 Alert] + [Gmail] + [Notion: Failed Tasks]
```

### 4.3 เชื่อม LINE Webhook
1. Copy n8n Webhook URL จาก Webhook node ใน WF1
2. LINE Developers → Messaging API → Webhook URL → Paste → Verify
3. Enable: "Use webhook"

### 4.4 ทดสอบ End-to-End
1. ส่งข้อความใน LINE: "ทดสอบระบบ"
2. ตรวจ n8n execution log
3. ตรวจ Notion Inbox Log — ต้องมี entry ใหม่
4. ✅ ถ้าเห็น entry = ระบบทำงาน

---

## สัปดาห์ถัดไป — L6 Auto-Mode

สร้าง n8n Workflows 2-6 ตามลำดับ:
- WF2: Daily Brief (Cron 07:00)
- WF3: Market Pulse (Cron every 6h)
- WF4: Weekly OKR (Cron Sunday 20:00)
- WF5: HITL Saver (Webhook)
- WF6: Health Ping (Cron every 6h)

---

## ❓ ถ้าติดปัญหา

| ปัญหา | วิธีแก้ |
|---|---|
| LINE ไม่ตอบ | ตรวจ Webhook URL ใน LINE Console + n8n Workflow Active? |
| Dify agent ไม่ตอบ | ตรวจ API Key + endpoint URL ใน n8n HTTP node |
| Notion ไม่อัปเดต | ตรวจว่า share database กับ Integration แล้วหรือยัง |
| n8n error | เปิด Execution Log → ดู node ที่พัง → ตรวจ credentials |

---

> **Coprem OS v7.2** | ไม่มี code | ไม่มี debug | มีแต่ผลลัพธ์
