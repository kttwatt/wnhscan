# Performance Quick-Wins

## Goal

ทำให้แอปเร็วขึ้น (ลด network/DB ซ้ำซ้อน, ลดขนาด client bundle, จำกัด query ที่ไม่มีขอบเขต)
โดย **ไม่แตะโมเดลความปลอดภัย** (middleware auth + server-action role checks + Postgres RLS ยังเหมือนเดิมทุกชั้น)
และ **ไม่เพิ่ม dependency ใหม่**

## Scope

Low-risk quick wins เท่านั้น — ไม่มีการเปลี่ยนสถาปัตยกรรม (ไม่ทำ list virtualization,
ไม่ย้าย client fetch ไป RSC, ไม่เพิ่ม data-layer/SWR)

## Changes

### 1. Dedupe client fetches (impact: high)

`useScanLogs` และ `usePendingQueue` ถูกเรียกแยกกันหลาย instance ต่อหน้า ทำให้หน้า home /
close-round / queue ยิง fetch เต็มก้อนซ้ำ 2–3 ครั้ง

- สร้าง shared client store (module-level cache + subscriber) แบบเดียวกับ
  `use-catalog-subgroups.ts` โดย key ด้วย `departmentCode` / `departmentId`
- คง event เดิม (`SCAN_LOG_CHANGED_EVENT`, `PENDING_CHANGED_EVENT`, `focus`) เป็นตัว invalidate cache
  → พฤติกรรม refresh เหมือนเดิม ต่างแค่ fetch ครั้งเดียวแล้วแชร์
- **Risk:** low. ข้อมูลเดิม, semantics เดิม, แค่ลดจำนวน request

**Files:** `src/lib/hooks/use-scan-logs.ts`, `src/lib/hooks/use-pending-queue.ts`
(อาจแยก store helper เป็นไฟล์ย่อยถ้าอ่านง่ายขึ้น)

### 2. Dedupe `getProfile()` ต่อ request (impact: med)

Dashboard layout และแต่ละ page เรียก `getProfile()` ซ้ำ (แต่ละครั้งทำ waterfall
`getUser` → profile → departments)

- ห่อ `getProfile()` ด้วย React `cache()` (request-scoped) → รันครั้งเดียวต่อ request แล้ว reuse
- Parallelize waterfall ภายในด้วย `Promise.all` เฉพาะส่วนที่ไม่ขึ้นต่อกัน
- **Risk:** low. เป็น memoization ภายใน request เดียว ไม่เปลี่ยน auth semantics

**Files:** `src/lib/auth/get-profile.ts`

### 3. จำกัด query ที่ไม่มีขอบเขต (impact: high)

- `listScanBatches()` — เพิ่ม default cap **500 batch ล่าสุด** (เรียงตาม `saved_at` DESC อยู่แล้ว)
  + รับ optional `limit` param
- `countPendingQtyForDepartmentCodes()` — เปลี่ยนไปใช้ SQL-side sum แทนการดึงทุกแถวแล้ว reduce ใน JS
- **Risk:** low–med. การ cap 500 เป็นการเปลี่ยนพฤติกรรมที่มองเห็นได้เพียงจุดเดียว
  (ประวัติเก่ากว่า 500 batch จะไม่แสดงจนกว่าจะเพิ่ม "load more" ภายหลัง — อยู่นอก scope นี้)

**Files:** `src/lib/scan/scan-db.server.ts`, `src/lib/pending/pending-db.server.ts`
(+ signature ของ action ที่เกี่ยวข้องใน `scan-actions.ts` ถ้าต้องส่ง limit)

### 4. ลดขนาด client bundle (impact: med)

- เพิ่ม `experimental.optimizePackageImports: ['lucide-react']` ใน `next.config.ts`
- Dynamic-import `jsbarcode` ใน `Code128Barcode` (ใช้อยู่ใน `useEffect` อยู่แล้ว)
  → โหลด lib ตอนต้องใช้ ไม่รวมใน initial bundle ของทุกหน้าที่มีตาราง
- **Risk:** low. barcode วาดช้าลงเสี้ยววินาทีตอน paint แรก ไม่เปลี่ยนฟังก์ชัน

**Files:** `next.config.ts`, `src/components/catalog/code128-barcode.tsx`

### 5. Batch pending-cart writes (impact: med)

`addPendingFromCart` วน loop ต่อ item (select → update/insert) = N+1

- ยืนยันแล้วว่ามี `UNIQUE (department_id, item_code)` บน `pending_queue_items`
- เปลี่ยนเป็น: อ่านแถวเดิมของ codes ใน cart ครั้งเดียว (`.in('item_code', codes)`)
  → รวม quantity ใน JS → `upsert` ครั้งเดียว (1 select + 1 upsert)
- **Risk:** low. ไม่ต้องเพิ่ม migration; upsert ใช้ unique key ที่มีอยู่

**Files:** `src/lib/pending/pending-db.server.ts`

## Out of scope

- List virtualization (catalog / scan-log tables)
- ย้าย client data fetching ไป server components (RSC)
- data-layer / SWR / React Query หรือ dependency ใหม่ใดๆ
- "load more" สำหรับประวัติ scan เกิน 500 batch

## Verification

- `npm run lint` + type check (`tsc`) ผ่าน
- Re-verify เส้นทาง user / manager / admin สำหรับส่วนที่แตะ shared data loading
- ไม่มี debug/telemetry ค้าง
