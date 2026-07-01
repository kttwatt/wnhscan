-- Webapp uses localStorage for pending queue (จดไว้ก่อน) and scan logs (บันทึกการสแกน).
-- These legacy tables/RPCs are not referenced in src/.

DROP FUNCTION IF EXISTS public.frequent_scanned_items(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.recent_scanned_items(uuid, integer);
DROP FUNCTION IF EXISTS public.add_prescan_item(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.cancel_prescan_item(uuid);
DROP FUNCTION IF EXISTS public.complete_prescan_scan(uuid[]);
DROP FUNCTION IF EXISTS public.log_audit(text, text, uuid, uuid, jsonb);

DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.scan_logs CASCADE;
DROP TABLE IF EXISTS public.prescan_items CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
