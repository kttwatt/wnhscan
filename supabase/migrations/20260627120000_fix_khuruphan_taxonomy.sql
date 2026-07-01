-- Align ครุภัณฑ์ group/subgroup names with IPISS standard spelling.
BEGIN;

UPDATE public.item_groups
SET name = 'ครุภัณฑ์'
WHERE name = 'คุรุภัณฑ์';

UPDATE public.item_subgroups
SET name = REPLACE(name, 'คุรุภัณฑ์', 'ครุภัณฑ์')
WHERE name LIKE 'คุรุภัณฑ์%';

UPDATE public.item_subgroups
SET name = 'ครุภัณฑ์ดนตรีและนาฏศิลป์'
WHERE name = 'ครุภัณฑ์ดนตรีนาฏศิลป์';

COMMIT;
