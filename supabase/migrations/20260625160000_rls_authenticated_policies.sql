-- Tighten RLS: scope data policies to authenticated role (not anon).

DROP POLICY IF EXISTS departments_admin_all ON public.departments;
CREATE POLICY departments_admin_all ON public.departments
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS departments_select_own_or_admin ON public.departments;
CREATE POLICY departments_select_own_or_admin ON public.departments
  FOR SELECT TO authenticated
  USING (is_admin() OR user_has_department(id));

DROP POLICY IF EXISTS item_groups_admin_all ON public.item_groups;
CREATE POLICY item_groups_admin_all ON public.item_groups
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS item_subgroups_admin_all ON public.item_subgroups;
CREATE POLICY item_subgroups_admin_all ON public.item_subgroups
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS items_admin_all ON public.items;
CREATE POLICY items_admin_all ON public.items
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (id = auth.uid()) OR is_admin() OR manager_can_view_profile(id)
  );

DROP POLICY IF EXISTS profiles_update_own_or_admin ON public.profiles;
CREATE POLICY profiles_update_own_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING ((id = auth.uid()) OR is_admin())
  WITH CHECK ((id = auth.uid()) OR is_admin());

DROP POLICY IF EXISTS user_departments_delete ON public.user_departments;
CREATE POLICY user_departments_delete ON public.user_departments
  FOR DELETE TO authenticated
  USING (is_admin() OR is_department_manager(department_id));

DROP POLICY IF EXISTS user_departments_insert ON public.user_departments;
CREATE POLICY user_departments_insert ON public.user_departments
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_department_manager(department_id));

DROP POLICY IF EXISTS user_departments_select ON public.user_departments;
CREATE POLICY user_departments_select ON public.user_departments
  FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid()) OR is_admin() OR is_department_manager(department_id)
  );

DROP POLICY IF EXISTS user_departments_update_admin ON public.user_departments;
CREATE POLICY user_departments_update_admin ON public.user_departments
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS dept_items_insert ON public.department_items;
CREATE POLICY dept_items_insert ON public.department_items
  FOR INSERT TO authenticated
  WITH CHECK (is_department_manager(department_id));

DROP POLICY IF EXISTS dept_items_select ON public.department_items;
CREATE POLICY dept_items_select ON public.department_items
  FOR SELECT TO authenticated
  USING (user_has_department(department_id));

DROP POLICY IF EXISTS dept_items_update ON public.department_items;
CREATE POLICY dept_items_update ON public.department_items
  FOR UPDATE TO authenticated
  USING (is_department_manager(department_id))
  WITH CHECK (is_department_manager(department_id));
