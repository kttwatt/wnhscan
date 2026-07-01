import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listDepartments } from "@/lib/auth/departments-db.server";
import {
  type DbProfileRow,
  type ProfileRow,
  departmentCodesFromLinks,
  toProfileRow,
} from "@/lib/auth/database";
import type { UserProfile } from "@/lib/auth/types";

const PROFILE_SELECT =
  "id, username, email, full_name, department_id, role, created_at";

async function loadActiveDepartmentCodes(): Promise<string[]> {
  const departments = await listDepartments();
  return departments
    .map((department) => department.code)
    .filter((code): code is string => Boolean(code));
}

function toUserProfile(row: ProfileRow, activeDepartmentCodes: string[]): UserProfile {
  return {
    email: row.email,
    role: row.role,
    departmentIds: row.department_ids,
    activeDepartmentCodes,
  };
}

async function loadDepartmentLinks(userIds: string[]) {
  if (userIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_departments")
    .select("user_id, departments(code)")
    .in("user_id", userIds);

  return data ?? [];
}

async function enrichProfiles(rows: DbProfileRow[]): Promise<ProfileRow[]> {
  if (rows.length === 0) return [];

  const links = await loadDepartmentLinks(rows.map((row) => row.id));

  const legacyDeptIds = [
    ...new Set(
      rows
        .filter((row) => departmentCodesFromLinks(row.id, links).length === 0 && row.department_id)
        .map((row) => row.department_id as string),
    ),
  ];

  const legacyCodeByDeptId = new Map<string, string>();
  if (legacyDeptIds.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("departments")
      .select("id, code")
      .in("id", legacyDeptIds)
      .is("deleted_at", null);

    for (const dept of data ?? []) {
      if (dept.code) legacyCodeByDeptId.set(dept.id, dept.code);
    }
  }

  return rows.map((row) => {
    let departmentIds = departmentCodesFromLinks(row.id, links);
    if (departmentIds.length === 0 && row.department_id) {
      const code = legacyCodeByDeptId.get(row.department_id);
      if (code) departmentIds = [code];
    }
    return toProfileRow(row, departmentIds);
  });
}

export const getProfile = cache(async (): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single<DbProfileRow>();

  if (!profile) return null;

  const [activeDepartmentCodes, [enriched]] = await Promise.all([
    loadActiveDepartmentCodes(),
    enrichProfiles([profile]),
  ]);
  return toUserProfile(enriched, activeDepartmentCodes);
});

export async function toAccessProfile(row: ProfileRow): Promise<UserProfile> {
  const activeDepartmentCodes = await loadActiveDepartmentCodes();
  return toUserProfile(row, activeDepartmentCodes);
}

export async function getProfileRow(): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single<DbProfileRow>();

  if (!profile) return null;

  const [enriched] = await enrichProfiles([profile]);
  return enriched;
}

export async function listProfiles(): Promise<ProfileRow[]> {
  const self = await getProfileRow();
  if (!self || self.role !== "admin") {
    throw new Error("ไม่มีสิทธิ์ดูรายชื่อผู้ใช้ทั้งหมด");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .order("email");

  if (error) throw error;
  if (!data?.length) return [];

  return enrichProfiles(data as DbProfileRow[]);
}
