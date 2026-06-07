# Eilinaire FOCUS Collection — GTM Playbook Q3 2026

> Source: KB me_ssot.md (AIDA framework) + eilinaire_constitution.md + PAM Canvas (WF13)
> Owner: Prem | Agent: Marketing Agent | Status: ACTIVE

---

## 1. Target Customer (Persona)

**Primary:** High-velocity workers (25–40 ปี)
- ทำงานหนัก ตัดสินใจเยอะ เหนื่อยกับ noise
- ต้องการ clarity ไม่ใช่ stimulation
- ซื้อของที่ "ทำงานให้" ไม่ใช่ของที่ "ดูดี"

**Pain:** Cognitive overload, decision fatigue, scattered focus
**Desire:** Mental stillness, structured energy, controlled direction
**Trigger:** เห็น content ที่พูดถึง "ลดทางเลือก = โฟกัสได้มากขึ้น"

---

## 2. AIDA Launch Framework (จาก me_ssot.md)

### A — Attention (Week 1–2)
**Goal:** สร้าง awareness ใน target segment

| Action | Channel | Output |
|---|---|---|
| Content series "Less choice. More clarity." | IG / TikTok | 5 posts/week |
| Hook: "คุณเสียเวลา 2.5 ชม./วัน กับการตัดสินใจเรื่องเล็กน้อย" | Reels | 3 videos |
| Early Tease (no product reveal) | Stories | daily |

**WF14 trigger:** `POST /webhook/content-brief` topic=attention phase

---

### I — Interest (Week 3–4)
**Goal:** ให้คนเข้าใจว่า EILINAIRE คืออะไรจริงๆ

| Action | Channel | Output |
|---|---|---|
| Brand story content (constitution) | Long-form IG / Blog | 2 posts |
| "What FOCUS means to us" | Video essay | 1 video |
| Lead magnet: Early Access signup | Landing page | WF13 LC1 webhook |

**Webhook:** `POST /webhook/lead-capture` brand=eilinaire source=instagram

---

### D — Desire (Week 5–6)
**Goal:** ให้คนอยาก own FOCUS collection

| Action | Channel | Output |
|---|---|---|
| Product reveal (drink + shirt) | IG / TikTok | 3 posts |
| Social proof: Early member testimonials | Stories | ongoing |
| Limited edition positioning | All channels | messaging |
| Nurture email sequence (Day 3, 7) | WF13 LC5 | auto |

---

### A — Action (Week 7–8 = Launch)
**Goal:** Convert

| Action | Channel | Output |
|---|---|---|
| Launch announcement | All channels | D-day |
| Early member exclusive offer | Telegram / Email | WF13 LC5 Day 14 |
| Limited stock messaging | IG Stories | daily |
| CTA: "สั่งซื้อ FOCUS" | Bio link + Story | ongoing |

---

## 3. PAM Canvas Integration

```
LC1: Instagram/TikTok → Bio link → Lead capture form
     → POST /webhook/lead-capture {brand: "eilinaire", source: "instagram"}

LC2: Welcome message (Day 0)
     → "สวัสดีครับ คุณเป็นหนึ่งใน Early Member ของ Eilinaire..."

LC5: Nurture sequence
     → Day 0: Welcome + brand story
     → Day 3: FOCUS collection preview
     → Day 7: Early access details
     → Day 14: Launch + exclusive offer
```

---

## 4. Content Calendar (Week 1–8)

| สัปดาห์ | Theme | Posts | WF14 Brief |
|---|---|---|---|
| W1 | Attention: Decision fatigue | 5 | topic="cognitive overload statistics" |
| W2 | Attention: Less choice concept | 5 | topic="less choice more clarity philosophy" |
| W3 | Interest: Brand story | 3 | topic="eilinaire brand constitution" |
| W4 | Interest: Lead capture | 3 + LP | - |
| W5 | Desire: Product tease | 4 | topic="FOCUS drink product reveal tease" |
| W6 | Desire: Social proof | 4 | topic="early member stories focus collection" |
| W7 | Action: Launch prep | 5 | topic="eilinaire FOCUS launch countdown" |
| W8 | Action: Launch day | 5 | topic="eilinaire FOCUS collection available now" |

**Auto-generate:** `POST /webhook/content-brief` ทุก brief ข้างต้น

---

## 5. KPIs

| Metric | Target Q3 |
|---|---|
| Early Members (LC1) | 500 leads |
| Email open rate | >40% |
| Content reach | 50k impressions |
| Launch conversion | 5% of leads |
| Revenue (units × price) | TBD by Prem |

---

## 6. Automation Stack

| Function | System | Webhook/Workflow |
|---|---|---|
| Lead capture | WF13 | `/webhook/lead-capture` |
| Nurture messages | WF13 LC5 (ทุก 6 ชม.) | auto |
| Content generation | WF14 | `/webhook/content-brief` |
| Strategy questions | WF15 | `/webhook/agent-router` |
| Telegram daily brief | WF02 | scheduled |

---

## 7. Iron Laws (จาก constitution — ห้ามละเมิด)

- ห้าม discount หรือ sale เพื่อ volume
- ห้ามทำ mass marketing — เน้น quality over reach
- ทุก content ต้อง reflect "Structure > Beauty"
- ห้าม collaborate กับ brand ที่ขัดกับ core philosophy
