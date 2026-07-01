import type { UserRole } from "@/lib/auth/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  manager: "ผู้จัดการแผนก",
  user: "ผู้ใช้งาน",
};

export function formatUserRole(role: UserRole): string {
  return ROLE_LABELS[role];
}
