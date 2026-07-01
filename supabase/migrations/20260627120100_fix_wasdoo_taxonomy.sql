-- Align วัสดุ subgroup name with IPISS standard spelling.
BEGIN;

UPDATE public.item_subgroups
SET name = 'วัสดุเอกซเรย์'
WHERE name = 'วัสดุเอ็กซเรย์';

COMMIT;
