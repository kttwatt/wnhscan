import type { UserRole } from "@/lib/auth/types";

export type AppUser = {
  id: string;
  email: string;
  role: UserRole;
  departmentIds: string[];
};

/** @deprecated Use Supabase profiles via get-profile.ts */
export const MOCK_USERS: AppUser[] = [];

export { formatUserRole } from "@/lib/auth/roles";

export function usersForDepartment(): AppUser[] {
  return [];
}
