-- แผนกเหลือ OR (ห้องผ่าตัด) และ AN (วิสัญญี)
BEGIN;

UPDATE public.departments
SET name = 'ห้องผ่าตัด'
WHERE code = 'OR' AND deleted_at IS NULL;

UPDATE public.departments
SET code = 'AN', name = 'วิสัญญี'
WHERE code = 'ANC' AND deleted_at IS NULL;

-- ย้ายรายการจากคลัง (WH) ไป OR ถ้ายังไม่มีใน OR
UPDATE public.department_items di
SET department_id = or_dept.id
FROM public.departments wh_dept
JOIN public.departments or_dept ON or_dept.code = 'OR' AND or_dept.deleted_at IS NULL
WHERE di.department_id = wh_dept.id
  AND wh_dept.code = 'WH'
  AND di.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.department_items existing
    WHERE existing.department_id = or_dept.id
      AND existing.item_id = di.item_id
      AND existing.deleted_at IS NULL
  );

-- ลบ assignment ที่ซ้ำ / แผนกที่ปิดใช้งาน
UPDATE public.department_items di
SET deleted_at = COALESCE(di.deleted_at, now())
FROM public.departments d
WHERE di.department_id = d.id
  AND d.code IN ('WH', 'OPD')
  AND di.deleted_at IS NULL;

DELETE FROM public.user_departments ud
USING public.departments d
WHERE ud.department_id = d.id
  AND d.code IN ('WH', 'OPD');

UPDATE public.profiles p
SET department_id = NULL
FROM public.departments d
WHERE p.department_id = d.id
  AND d.code IN ('WH', 'OPD');

UPDATE public.departments
SET deleted_at = now()
WHERE code IN ('OPD', 'WH')
  AND deleted_at IS NULL;

COMMIT;
