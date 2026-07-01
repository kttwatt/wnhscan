import { ALL_DEPARTMENTS } from "@/lib/auth/departments";
import type { UserProfile } from "@/lib/auth/types";

export function isAdmin(profile: UserProfile): boolean {
  return profile.role === "admin";
}

export function isDepartmentManager(profile: UserProfile): boolean {
  return profile.role === "manager";
}

export function canAccessAdmin(profile: UserProfile): boolean {
  return isAdmin(profile);
}

export function canAccessDepartmentPage(profile: UserProfile): boolean {
  if (isAdmin(profile)) return true;
  return isDepartmentManager(profile) && profile.departmentIds.length > 0;
}

/** สร้าง/แก้ไขข้อมูลวัสดุในฐานข้อมูลกลาง — เฉพาะผู้ดูแลระบบ */
export function canManageCatalogMaster(profile: UserProfile): boolean {
  return isAdmin(profile);
}

/** ปิดรอบสแกน — ผู้จัดการแผนกและผู้ดูแลระบบ */
export function canAccessCloseRound(profile: UserProfile): boolean {
  return isAdmin(profile) || canAccessDepartmentPage(profile);
}

function activeDepartmentCodes(profile: UserProfile): string[] {
  if (profile.activeDepartmentCodes.length > 0) {
    return profile.activeDepartmentCodes;
  }
  return [...ALL_DEPARTMENTS];
}

/** แผนกที่จัดการได้ในหน้า department — admin ทุกแผนก, ผู้จัดการเฉพาะที่รับผิดชอบ */
export function allowedDepartments(profile: UserProfile): string[] {
  if (isAdmin(profile)) return activeDepartmentCodes(profile);
  return profile.departmentIds;
}

/** หน่วยงานที่เลือกได้ใน switcher — จำกัดตาม role ไม่ให้เห็นข้อมูลแผนกอื่น */
export function selectableDepartments(profile: UserProfile): string[] {
  if (isAdmin(profile)) return activeDepartmentCodes(profile);
  if (profile.departmentIds.length > 0) return [...profile.departmentIds];
  return [];
}

export function canAccessDepartment(profile: UserProfile, departmentId: string): boolean {
  return selectableDepartments(profile).includes(departmentId);
}
