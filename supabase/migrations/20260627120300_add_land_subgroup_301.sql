-- เพิ่ม ที่ดิน (301) สำหรับ DB ที่รัน migration ก่อนหน้าแบบไม่มี 301
BEGIN;

INSERT INTO public.item_subgroups (id, group_id, name, sort_order, created_at, code) VALUES
  ('b3010301-0000-4000-8000-000000000301'::uuid, 'b5129ccd-0adf-4386-bb5d-7f3235814278'::uuid, 'ที่ดิน', 1, '2026-06-20 15:41:17.391463+00'::timestamptz, '301')
ON CONFLICT (id) DO NOTHING;

UPDATE public.item_subgroups SET sort_order = 2 WHERE id = 'b3010302-0000-4000-8000-000000000302'::uuid;
UPDATE public.item_subgroups SET sort_order = 3 WHERE id = 'b3010303-0000-4000-8000-000000000303'::uuid;
UPDATE public.item_subgroups SET sort_order = 4 WHERE id = 'b3010304-0000-4000-8000-000000000304'::uuid;
UPDATE public.item_subgroups SET sort_order = 5 WHERE id = 'b3010305-0000-4000-8000-000000000305'::uuid;
UPDATE public.item_subgroups SET sort_order = 6 WHERE id = 'b3010306-0000-4000-8000-000000000306'::uuid;
UPDATE public.item_subgroups SET sort_order = 7 WHERE id = 'b3010307-0000-4000-8000-000000000307'::uuid;
UPDATE public.item_subgroups SET sort_order = 8 WHERE id = 'b3010308-0000-4000-8000-000000000308'::uuid;
UPDATE public.item_subgroups SET sort_order = 9 WHERE id = 'b3010309-0000-4000-8000-000000000309'::uuid;
UPDATE public.item_subgroups SET sort_order = 10 WHERE id = 'b3010310-0000-4000-8000-000000000310'::uuid;
UPDATE public.item_subgroups SET sort_order = 11 WHERE id = 'b3010311-0000-4000-8000-000000000311'::uuid;
UPDATE public.item_subgroups SET sort_order = 12 WHERE id = 'b3010312-0000-4000-8000-000000000312'::uuid;
UPDATE public.item_subgroups SET sort_order = 13 WHERE id = 'b3010313-0000-4000-8000-000000000313'::uuid;
UPDATE public.item_subgroups SET sort_order = 14 WHERE id = 'b3010314-0000-4000-8000-000000000314'::uuid;
UPDATE public.item_subgroups SET sort_order = 15 WHERE id = 'b3010315-0000-4000-8000-000000000315'::uuid;

COMMIT;
