# AI Tools for Marketers — Reference Guide

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Tools ที่ใช้ใน COPREM workflow

| Tool | ใช้ทำอะไร | Access |
|---|---|---|
| Claude (via Jeff) | Copy writing, strategy, analysis | Telegram /caption /campaign |
| Canva | Design assets | canva.com |
| TikTok Creative Center | Trend research | ads.tiktok.com/creative |
| Shopee Seller Center | Product listing, ads | seller.shopee.co.th |
| n8n | Automation workflows | localhost:5678 |
| COPREM Dashboard | KB, approvals, sessions | localhost:3001 |

## Prompt Templates สำหรับ Jeff

### TikTok Caption
```
/caption [product name] [key benefit] [target emotion]
ตัวอย่าง: /caption Batiste Original ผมสวยเร็ว สาวออฟฟิศ
```

### Shopee Description
```
/description [product] [features] [target]
```

### Campaign Brief
```
/campaign [objective] [brand] [budget] [timeline]
```

## AI Content Guidelines

**ห้าม:**
- ใช้ AI generate claim ที่ไม่มีหลักฐาน (Lex จะ BLOCK)
- Copy ที่ดู AI-generated เกินไป — ต้อง humanize เสมอ
- ใช้ภาษาอังกฤษ 100% ในโพสต์ไทย

**ควร:**
- ใช้ AI เป็น draft → แก้ด้วยตัวเอง → ผ่าน Quinn
- Mix Thai-English ตาม brand tone
- A/B test copy หลายๆ version

## Content Production SOP

```
1. Brief → Jeff (/caption หรือ /campaign)
2. Draft → Quinn review (quality gate)
3. Legal check → Lex (ถ้าเป็น health claim)
4. Design → Canva
5. Prem approve → Publish
6. Track metrics → 7 วัน → Rex ROI report
```
