import type { UserProfile } from "@/lib/auth/types";

/** Mock จนกว่าจะมี Supabase auth — เปลี่ยน role / departmentIds เพื่อทดสอบสิทธิ์ */
export const MOCK_PROFILE: UserProfile = {
  email: "admin@hospital.local",
  role: "admin",
  departmentIds: [],
  activeDepartmentCodes: ["OR", "AN"],
};
