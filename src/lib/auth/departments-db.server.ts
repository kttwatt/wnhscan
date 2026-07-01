import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toDepartmentRows, type DepartmentRow } from "@/lib/auth/departments-db";

export type { DepartmentRow };

export async function listDepartments(): Promise<DepartmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, code, name")
    .is("deleted_at", null)
    .order("code");

  if (error) throw error;
  return toDepartmentRows(data ?? []);
}

/** Server-only list for public forms (e.g. login create-user) — bypasses RLS. */
export async function listDepartmentsAdmin(): Promise<DepartmentRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("departments")
    .select("id, code, name")
    .is("deleted_at", null)
    .order("code");

  if (error) throw error;
  return toDepartmentRows(data ?? []);
}
