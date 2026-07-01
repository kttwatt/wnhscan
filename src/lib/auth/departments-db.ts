import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type DepartmentRow = {
  id: string;
  code: string;
  name: string;
};

export function toDepartmentRows(rows: Pick<Tables<"departments">, "id" | "code" | "name">[]): DepartmentRow[] {
  return rows.flatMap((row) => (row.code ? [{ id: row.id, code: row.code, name: row.name }] : []));
}

export async function fetchDepartments(): Promise<DepartmentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, code, name")
    .is("deleted_at", null)
    .order("code");

  if (error) throw error;
  return toDepartmentRows(data ?? []);
}

export function formatDepartmentDisplay(dept: DepartmentRow): string {
  if (dept.name && dept.name !== dept.code) {
    return `${dept.name} (${dept.code})`;
  }
  return dept.code;
}

export function departmentLabelByCode(
  departments: DepartmentRow[],
  code: string,
): string {
  const dept = departments.find((d) => d.code === code);
  return dept ? formatDepartmentDisplay(dept) : code;
}
