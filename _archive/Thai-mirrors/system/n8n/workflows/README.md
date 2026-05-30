# Workflow Specs (Thai Mirror)

> Read-only mirror ของ `English/system/n8n/workflows/`
> ไฟล์ปฏิบัติการจริงอยู่ที่ฝั่ง English เท่านั้น

| Workflow | กำหนดการ | หน้าที่ |
|---------|----------|---------|
| 01 Inbox Receiver | เมื่อรับข้อความ Telegram | Pipeline หลัก |
| 02 Morning Brief | 07:00 ทุกวัน | สรุปงานเช้า |
| 03 Market Scanner | ทุก 6 ชั่วโมง | สแกน keyword ตลาด |
| 04 OKR Review | อาทิตย์ 20:00 | รีวิวเป้าหมายรายอาทิตย์ |
| 05 HITL Saver | เมื่อรับ webhook | บันทึกการอนุมัติ |
| 06 Health Ping | ทุก 6 ชั่วโมง | ตรวจสุขภาพระบบ |
| 07 Feedback Collector | เมื่อรับ webhook | เก็บคะแนน ⭐ |
| 08 Self Optimization | อาทิตย์ 22:00 | ปรับ prompt อัตโนมัติ |
| 09 Backup | อาทิตย์ 03:00 | สำรองข้อมูล |
| 10 KB Sync | เมื่อไฟล์เปลี่ยน | sync ความรู้ |
| 11 DLQ Processor | ทุก 4 ชั่วโมง | จัดการงานที่ล้มเหลว |
