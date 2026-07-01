import type { UserRole } from "@/lib/auth/types";
import type { Tables } from "@/lib/supabase/database.types";

/** Raw profile row as stored in Supabase `profiles` table. */
export type DbProfileRow = Tables<"profiles">;

/** App-facing profile with mapped role and department codes. */
export type ProfileRow = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department_ids: string[];
  created_at: string;
};

export function mapDbRoleToApp(role: string): UserRole {
  if (role === "admin") return "admin";
  if (role === "deptmanager") return "manager";
  return "user";
}

export function mapAppRoleToDb(role: UserRole): string {
  if (role === "admin") return "admin";
  if (role === "manager") return "deptmanager";
  return "user";
}

type DeptLink = {
  user_id: string;
  departments: { code: string | null } | { code: string | null }[] | null;
};

export function departmentCodesFromLinks(
  userId: string,
  links: DeptLink[] | null | undefined,
): string[] {
  const codes = new Set<string>();
  for (const link of links ?? []) {
    if (link.user_id !== userId) continue;
    const dept = link.departments;
    if (!dept) continue;
    if (Array.isArray(dept)) {
      dept.forEach((d) => {
        if (d.code) codes.add(d.code);
      });
    } else if (dept.code) {
      codes.add(dept.code);
    }
  }
  return [...codes];
}

export function toProfileRow(
  row: DbProfileRow,
  departmentIds: string[],
): ProfileRow {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    role: mapDbRoleToApp(row.role),
    department_ids: departmentIds,
    created_at: row.created_at,
  };
}
