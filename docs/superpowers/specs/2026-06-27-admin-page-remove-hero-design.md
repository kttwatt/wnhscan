# Admin Page — Remove Admin Only Hero

## Goal

ลบ section **Admin only / ภาพรวมระบบ** ด้านล่างหน้า `/admin` — การ์ด 4 ใบด้านบนครอบคลุมงาน admin แล้ว ไม่ต้องมีปุ่ม placeholder (Audit log, ตั้งค่า) ที่ยังไม่มี backend

## Approach

**ลบทั้ง section** — KISS, ไม่ซ้ำกับการ์ดลิงก์ด้านบน

## UX changes

| เดิม | ใหม่ |
|------|------|
| PageHeader + grid 4 การ์ด + section-navy ด้านล่าง | PageHeader + grid 4 การ์ด |
| ปุ่ม Audit log / ตั้งค่า (ไม่ทำงาน) | ลบ |

## Out of scope

- สร้างหน้า Audit log / ตั้งค่า
- Stat dashboard
- เปลี่ยนการ์ด 4 ใบ

## Success criteria

1. หน้า `/admin` แสดงเฉพาะ PageHeader + การ์ด 4 ใบ
2. ไม่มีปุ่ม dead-end
3. Layout สะอาด ไม่มี section ว่างด้านล่าง
