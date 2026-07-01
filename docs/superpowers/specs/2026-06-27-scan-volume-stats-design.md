# Scan Volume Statistics

## Goal

แสดงสถิติปริมาณการสแกน (วันนี้ / สัปดาห์ / แยก mode) บนหน้าหลักและปิดรอบสแกน

## Stats (4 cards)

| Label | Filter |
|-------|--------|
| สแกนวันนี้ | วันนี้, ทุก mode |
| สแกนสัปดาห์นี้ | 7 วัน rolling, ทุก mode |
| สแกนทันที · 7 วัน | 7 วัน, instant_scan |
| ปิดรอบแล้ว · 7 วัน | 7 วัน, queue_scan |

หน่วย: **ชิ้น** (sum quantity)

## Pages

- **หน้าหลัก:** แทน grid เดิม (จดไว้ก่อน, all-time, stale) ด้วย ScanVolumeStatsGrid
- **ปิดรอบสแกน:** stat strip ด้านบน + flowchart; node ล่าง = สแกนสัปดาห์นี้

## Interaction

คลิก stat → ScanLogModal พร้อม preset filter

## Files

- `src/lib/scan/scan-log-queries.ts` — sumScannedQuantity, weekDateRange, presetForVolumeStat
- `src/lib/hooks/use-scan-volume-stats.ts`
- `src/components/dashboard/scan-volume-stats.tsx`
- `src/components/department/scan-log-modal.tsx` — preset prop
