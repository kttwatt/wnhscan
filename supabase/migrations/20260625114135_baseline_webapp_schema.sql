-- WNHScan baseline schema (webapp tables only)

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- item taxonomy
CREATE TABLE IF NOT EXISTS public.item_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  code text
);

CREATE UNIQUE INDEX IF NOT EXISTS item_groups_code_key
  ON public.item_groups (code) WHERE code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.item_subgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.item_groups (id),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  code text,
  UNIQUE (group_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS item_subgroups_group_code_key
  ON public.item_subgroups (group_id, code) WHERE code IS NOT NULL;

-- items
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  unit text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  barcode text NOT NULL UNIQUE,
  subgroup_id uuid NOT NULL REFERENCES public.item_subgroups (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS items_search_trgm_idx
  ON public.items USING gin (
    ((((code || ' '::text) || name) || ' '::text) || barcode) gin_trgm_ops
  );

-- profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  department_id uuid REFERENCES public.departments (id),
  role text NOT NULL DEFAULT 'user'::text
    CHECK (role = ANY (ARRAY['admin'::text, 'deptmanager'::text, 'user'::text])),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- department membership + catalog links
CREATE TABLE IF NOT EXISTS public.user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, department_id)
);

CREATE INDEX IF NOT EXISTS user_departments_user_id_idx
  ON public.user_departments (user_id);

CREATE TABLE IF NOT EXISTS public.department_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users (id),
  added_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (department_id, item_id)
);

CREATE INDEX IF NOT EXISTS department_items_dept_added_at_active_idx
  ON public.department_items (department_id, added_at DESC)
  WHERE deleted_at IS NULL;

-- helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_department(dept uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_departments ud
      WHERE ud.user_id = auth.uid() AND ud.department_id = dept
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.department_id = dept
    );
$$;

CREATE OR REPLACE FUNCTION public.is_department_manager(dept uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT public.is_admin()
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'deptmanager'
      AND public.user_has_department(dept)
    );
$$;

CREATE OR REPLACE FUNCTION public.user_department_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.manager_can_view_profile(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'deptmanager'
    AND (
      EXISTS (
        SELECT 1
        FROM public.user_departments mine
        JOIN public.user_departments theirs
          ON mine.department_id = theirs.department_id
        WHERE mine.user_id = auth.uid()
          AND theirs.user_id = target
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles mine
        JOIN public.profiles theirs ON mine.department_id = theirs.department_id
        WHERE mine.id = auth.uid()
          AND theirs.id = target
          AND mine.department_id IS NOT NULL
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS items_updated_at ON public.items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_items ENABLE ROW LEVEL SECURITY;

-- departments
DROP POLICY IF EXISTS departments_admin_all ON public.departments;
CREATE POLICY departments_admin_all ON public.departments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS departments_select_own_or_admin ON public.departments;
CREATE POLICY departments_select_own_or_admin ON public.departments
  FOR SELECT USING (is_admin() OR user_has_department(id));

-- item_groups
DROP POLICY IF EXISTS item_groups_admin_all ON public.item_groups;
CREATE POLICY item_groups_admin_all ON public.item_groups
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS item_groups_select_authenticated ON public.item_groups;
CREATE POLICY item_groups_select_authenticated ON public.item_groups
  FOR SELECT TO authenticated
  USING ((deleted_at IS NULL) OR is_admin());

-- item_subgroups
DROP POLICY IF EXISTS item_subgroups_admin_all ON public.item_subgroups;
CREATE POLICY item_subgroups_admin_all ON public.item_subgroups
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS item_subgroups_select_authenticated ON public.item_subgroups;
CREATE POLICY item_subgroups_select_authenticated ON public.item_subgroups
  FOR SELECT TO authenticated
  USING ((deleted_at IS NULL) OR is_admin());

-- items
DROP POLICY IF EXISTS items_admin_all ON public.items;
CREATE POLICY items_admin_all ON public.items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS items_select_active ON public.items;
CREATE POLICY items_select_active ON public.items
  FOR SELECT TO authenticated
  USING ((deleted_at IS NULL) OR is_admin());

-- profiles
DROP POLICY IF EXISTS profiles_insert_admin ON public.profiles;
CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (
    (id = auth.uid()) OR is_admin() OR manager_can_view_profile(id)
  );

DROP POLICY IF EXISTS profiles_update_own_or_admin ON public.profiles;
CREATE POLICY profiles_update_own_or_admin ON public.profiles
  FOR UPDATE
  USING ((id = auth.uid()) OR is_admin())
  WITH CHECK ((id = auth.uid()) OR is_admin());

-- user_departments
DROP POLICY IF EXISTS user_departments_delete ON public.user_departments;
CREATE POLICY user_departments_delete ON public.user_departments
  FOR DELETE USING (is_admin() OR is_department_manager(department_id));

DROP POLICY IF EXISTS user_departments_insert ON public.user_departments;
CREATE POLICY user_departments_insert ON public.user_departments
  FOR INSERT WITH CHECK (is_admin() OR is_department_manager(department_id));

DROP POLICY IF EXISTS user_departments_select ON public.user_departments;
CREATE POLICY user_departments_select ON public.user_departments
  FOR SELECT USING (
    (user_id = auth.uid()) OR is_admin() OR is_department_manager(department_id)
  );

DROP POLICY IF EXISTS user_departments_update_admin ON public.user_departments;
CREATE POLICY user_departments_update_admin ON public.user_departments
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- department_items
DROP POLICY IF EXISTS dept_items_insert ON public.department_items;
CREATE POLICY dept_items_insert ON public.department_items
  FOR INSERT WITH CHECK (is_department_manager(department_id));

DROP POLICY IF EXISTS dept_items_select ON public.department_items;
CREATE POLICY dept_items_select ON public.department_items
  FOR SELECT USING (user_has_department(department_id));

DROP POLICY IF EXISTS dept_items_update ON public.department_items;
CREATE POLICY dept_items_update ON public.department_items
  FOR UPDATE
  USING (is_department_manager(department_id))
  WITH CHECK (is_department_manager(department_id));
