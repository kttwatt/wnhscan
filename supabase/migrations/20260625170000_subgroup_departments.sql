-- Map item subgroups to departments (controls which subgroups/items a department can use)
BEGIN;

CREATE TABLE IF NOT EXISTS public.subgroup_departments (
  subgroup_id uuid NOT NULL REFERENCES public.item_subgroups (id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subgroup_id, department_id)
);

CREATE INDEX IF NOT EXISTS subgroup_departments_department_id_idx
  ON public.subgroup_departments (department_id);

ALTER TABLE public.subgroup_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subgroup_departments_admin_all ON public.subgroup_departments;
CREATE POLICY subgroup_departments_admin_all ON public.subgroup_departments
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS subgroup_departments_select_authenticated ON public.subgroup_departments;
CREATE POLICY subgroup_departments_select_authenticated ON public.subgroup_departments
  FOR SELECT TO authenticated
  USING (true);

-- Default: subgroups that have active items → all departments
INSERT INTO public.subgroup_departments (subgroup_id, department_id)
SELECT DISTINCT sg.id, d.id
FROM public.item_subgroups sg
INNER JOIN public.items i ON i.subgroup_id = sg.id AND i.deleted_at IS NULL
CROSS JOIN public.departments d
WHERE sg.deleted_at IS NULL
  AND d.deleted_at IS NULL
ON CONFLICT DO NOTHING;

COMMIT;
