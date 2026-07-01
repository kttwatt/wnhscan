# Department Catalog Page Redesign

## Goal

ปรับหน้า `/department` ให้เน้น CRUD รายการวัสดุและพิมพ์สมุดรายการตาม filter ปัจจุบัน

## Layout

- PageHeader + DepartmentSwitcher (คงเดิม)
- Action bar: เพิ่มวัสดุ, ดูตัวอย่างก่อนพิมพ์
- ค้นหา + กรองหมวด
- ตารางรายการ (คลิกแถวแก้ไข)

## Print booklet

- Modal preview จัดกลุ่มตามหมวด
- แต่ละรายการ: รหัส, ชื่อ, บาร์โค้ด Code128, หน่วย
- Header: ชื่อหน่วยงาน + วันที่พิมพ์
- ปุ่มพิมพ์ → `window.print()` + `@media print` CSS

## Out of scope

- PDF export server-side
- Import CSV, bulk edit
