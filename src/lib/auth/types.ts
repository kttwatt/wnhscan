export type UserRole = "user" | "manager" | "admin";

export type UserProfile = {
  email: string;
  role: UserRole;
  /** แผนกที่ผู้ใช้สังกัด / ดูแล */
  departmentIds: string[];
  /** รหัสแผนกที่ active ในระบบ — โหลดจาก Supabase `departments` */
  activeDepartmentCodes: string[];
};
