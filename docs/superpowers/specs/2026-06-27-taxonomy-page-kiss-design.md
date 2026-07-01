# Taxonomy Page KISS Redesign

## Goal

ปรับหน้า `/admin/subgroup-mapping` (จัดการหมวดวัสดุ) ให้เรียบง่ายตาม KISS — โฟกัส **ดูภาพรวม** หมวดใหญ่และหมวดย่อย (ชื่อ + จำนวนรายการ) แก้ไข/เพิ่มผ่าน modal เล็ก

## Approach

**แนวทาง A — รายการเดียว ขยายทุกหมวดใหญ่**

- ลบแท็บหมวดใหญ่ + การ์ดขยาย/ย่อ
- แสดงทุกหมวดใหญ่เป็น section พร้อม flat list หมวดย่อย
- Modal เล็ก: ชื่อ (required) + ตั้งค่าเพิ่มเติม (รหัส/ลำดับ) แบบ collapsible

## Layout

```
PageHeader (จัดการหมวดวัสดุ)
└── card-whitespace
    ├── Toolbar: [เพิ่มหมวดใหญ่]  ค้นหาหมวดย่อย…
    ├── แสดง N หมวดใหญ่ · M หมวดย่อย
    └── สำหรับแต่ละหมวดใหญ่ (section):
        ├── หัว section: ชื่อ · N หมวดย่อย  [แก้ไข] [+ หมวดย่อย]
        └── แถว: ชื่อหมวดย่อย | จำนวนรายการ | [แก้ไข]
```

## UX changes

| เดิม | ใหม่ |
|------|------|
| แท็บเลือกหมวดใหญ่ | ทุกหมวดใหญ่เป็น section ขยายตลอด |
| การ์ดหมวดย่อยขยาย/ย่อ | แถว flat: ชื่อ + จำนวนรายการ |
| ขยายทั้งหมด / ย่อทั้งหมด | ลบ |
| แสดงรหัส/ลำดับบนหน้าหลัก | ซ่อน — อยู่ใน modal (collapsible) |
| Modal 3 ฟิลด์เท่ากันทุกครั้ง | Modal เล็ก: ชื่อ + ตั้งค่าเพิ่มเติม |
| คำอธิบายยาวใน card header | บรรทัดสรุปสั้น + summary count |

## Components

| Unit | หน้าที่ |
|------|---------|
| `AdminTaxonomyPanel` | orchestration, search, mutations |
| `TaxonomyOverview` (ใหม่) | sections + subgroup rows |
| `TaxonomyFormModal` (ใหม่) | modal เล็ก group/subgroup |
| `useCatalogTaxonomy` | คง hook เดิม |

## Modal (`TaxonomyFormModal`)

1. **ชื่อ** (required, autoFocus)
2. **ตั้งค่าเพิ่มเติม** (collapsed): รหัส, ลำดับ
3. หมวดย่อย: แสดงหมวดใหญ่ parent read-only
4. ปุ่ม: ยกเลิก | บันทึก

## States

- **Loading:** skeleton 2–3 section
- **Empty groups:** ข้อความ (ปุ่มใน toolbar)
- **Empty subgroups:** ข้อความสั้นใน section
- **Error:** แถบแดงใต้ toolbar
- **Search no results:** "ไม่พบหมวดย่อยที่ตรงกับ …"

## Out of scope

- ลบหมวด
- ย้ายหมวดย่อยข้ามหมวดใหญ่
- เปลี่ยน route
- รวม `CATALOG_ITEM_GROUPS` hardcode กับ DB
- Drag-and-drop เรียงลำดับ
- Inline edit

## Success criteria

1. เปิดหน้าแล้วเห็นหมวดใหญ่ทั้งหมด + หมวดย่อยพร้อมจำนวนรายการ โดยไม่ต้องคลิกแท็บ/ขยาย
2. UI ไม่เกิน 2 ชั้น visual (PageHeader + card)
3. แก้ไข/เพิ่มผ่าน modal เล็ก — ชื่อเป็นฟิลด์หลัก
4. ค้นหาหมวดย่อย filter ได้ทันที
5. ไม่กระทบ CRUD API / RLS / auth
