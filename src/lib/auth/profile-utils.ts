import type { ProfileRow } from "@/lib/auth/database";

export function usersForDepartmentFromProfiles(
  profiles: ProfileRow[],
  departmentId: string,
): ProfileRow[] {
  return profiles.filter(
    (user) => user.role === "admin" || user.department_ids.includes(departmentId),
  );
}
