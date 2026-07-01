# Scan Page KISS Redesign

## Goal

ปรับหน้า `/scan` (สแกนทันที) ให้เรียบง่ายตามหลัก KISS — **ช่องเดียว** สำหรับสแกนบาร์โค้ดหรือค้นหา สะสมรายการในแถบชุด แล้วกด **เริ่มสแกน** ทุกครั้ง (single และ multi ใช้ flow เดียวกัน)

## Approach

**แนวทาง B — ScanCommandField + useScanBatch**

- แยก component/hook เฉพาะหน้าสแกน ออกจาก `ItemSearchField` ที่ใช้ generic ในหน้าอื่น
- คง `SequentialScanModal` + `useScanWizard` สำหรับ verification

## Layout

```
PageHeader (สแกนทันที + DepartmentSwitcher)
└── card-whitespace
    ├── ScanCommandField (ช่องเดียว — autoFocus)
    │   └── dropdown ผลค้นหา (เฉพาะเมื่อพิมพ์)
    └── ScanBatchStrip
        ├── empty state
        ├── รายการ + ลบทีละรายการ
        └── ปุ่ม "เริ่มสแกน (N)"
└── ScanLogHistoryPanel
```

## UX changes

| เดิม | ใหม่ |
|------|------|
| ช่องค้นหา + รายการวัสดุเต็มหน้า | ช่องเดียว + dropdown เมื่อพิมพ์ |
| ปุ่ม "เลือกหลายรายการ" + checkbox | สแกน/ค้นหาสะสมใน batch strip |
| คลิกแถวเพื่อเปิด modal ทันที | สะสม batch → กด "เริ่มสแกน" ทุกครั้ง |
| แบนเนอร์คำแนะนำ | ลบออก |

## พฤติกรรมช่องเดียว

1. **Wedge scan** — สแกนเข้า input + Enter → exact match barcode/code → เพิ่ม batch, beep, clear field
2. **พิมพ์ค้นหา** — dropdown แบบ queue page; คลิกแถว → เพิ่ม batch
3. **Enter ขณะพิมพ์** — exact match เดียว → add; หลายผล → ให้เลือกจาก dropdown; ไม่พบ → error
4. **Duplicate** — สแกนซ้ำ → รวม quantity (+1)
5. **เริ่มสแกน** — เปิด `SequentialScanModal`; หลัง save → clear batch + refocus field
6. **Ctrl+Enter / F2** — shortcut เริ่มสแกนเมื่อ batch ไม่ว่าง

## ไฟล์ใหม่

- `src/lib/catalog/resolve-scan-input.ts`
- `src/lib/hooks/use-scan-batch.ts`
- `src/components/scan/scan-command-field.tsx`
- `src/components/scan/scan-batch-strip.tsx`

## Edge cases

- เปลี่ยนแผนกขณะ batch มีรายการ → clear batch + ข้อความแจ้ง
- รายการใน batch ไม่อยู่ใน catalog → prune เมื่อ catalog เปลี่ยน
- Modal เปิดอยู่ → field disabled

## Out of scope

- เปลี่ยน verification ใน modal
- รวม flow กับ queue
- แสดง catalog เต็มหน้า
- Backend IPISS integration

## Success criteria

1. interaction point หลักช่องเดียว — ไม่มี mode toggle
2. single: scan → batch (1) → เริ่มสแกน → modal → save
3. multi: scan หลายครั้ง → batch → เริ่มสแกน → wizard
4. ค้นหาจาก dropdown ได้
5. ไม่ regression ที่ history panel และ modal
