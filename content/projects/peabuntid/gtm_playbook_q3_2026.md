# Peabuntid — GTM Playbook Q3 2026

> Source: KB me_ssot.md + peabuntid_constitution.md + PAM Canvas (WF13)
> Owner: Prem | Agent: Marketing Agent | Status: ACTIVE

---

## 1. Target Customer

**Primary:** Reliability seekers + Local businesses (TH)
- หาข้อมูลยาก เพราะ feed เต็มไปด้วย noise
- ต้องการ trusted source ไม่ใช่ volume
- อยากอ่านสิ่งที่ผ่านการคัดกรองมาแล้ว

**Positioning:** "Trusted Curator" — ไม่ใช่ social media ไม่ใช่ marketplace แต่คือ information infrastructure

---

## 2. AIDA Launch Framework

### A — Attention
- Content: "ข้อมูลที่ดีควรเข้าถึงได้ง่าย ไม่ใช่จมอยู่ใน feed"
- Channel: LinkedIn + IG
- Hook: pain point ของคนที่ถูก information overload

### I — Interest
- Content series: curated weekly digest (3 เรื่อง/สัปดาห์)
- Show value ก่อน ask anything
- Lead magnet: subscribe รับ digest ฟรี

### D — Desire
- Testimonials จาก early subscribers
- Show depth: deep dive บทความ
- Community invitation

### A — Action
- Subscribe to weekly digest
- Webhook: `POST /webhook/lead-capture` brand=peabuntid

---

## 3. PAM Canvas

```
LC1: IG/LinkedIn → Bio link → Subscribe form
LC2: Welcome "ขอบคุณที่สนใจ Peabuntid — Trusted Curator..."
LC5: Weekly digest sequence
     → Day 0: Welcome + what is Peabuntid
     → Day 3: First curated content
     → Day 7: Deep dive article
     → Day 14: Community invite
```

---

## 4. KPIs Q3

| Metric | Target |
|---|---|
| Subscribers (LC1) | 200 leads |
| Weekly digest open rate | >50% |
| Content engagement | >5% |

---

## 5. Automation Stack

| Function | Webhook |
|---|---|
| Lead capture | `/webhook/lead-capture?brand=peabuntid` |
| Nurture | WF13 LC5 auto |
| Content generation | `/webhook/content-brief?brand=peabuntid` |
