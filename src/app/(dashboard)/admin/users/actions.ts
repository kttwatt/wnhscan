"use server";

import { revalidatePath } from "next/cache";
import { canAccessAdmin } from "@/lib/auth/access";
import { mapAppRoleToDb } from "@/lib/auth/database";
import { getProfileRow, toAccessProfile } from "@/lib/auth/get-profile";
import type { UserRole } from "@/lib/auth/types";
import { listDepartments } from "@/lib/auth/departments-db.server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true; adminId: string } | { ok: false; error: string }> {
  const profile = await getProfileRow();
  if (
    !profile ||
    !canAccessAdmin(await toAccessProfile(profile))
  ) {
    return { ok: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
  }
  return { ok: true, adminId: profile.id };
}

function validateDepartments(role: UserRole, departmentIds: string[]): string | null {
  if (role === "admin") return null;
  if (departmentIds.length === 0) {
    return "กรุณาเลือกหน่วยงานอย่างน้อย 1 แผนก";
  }
  return null;
}

async function validateDepartmentCodes(
  role: UserRole,
  departmentIds: string[],
): Promise<string | null> {
  if (role === "admin") return null;
  const departments = await listDepartments();
  const validCodes = new Set(departments.map((d) => d.code));
  const invalid = departmentIds.filter((id) => !validCodes.has(id));
  if (invalid.length > 0) return "หน่วยงานไม่ถูกต้อง";
  return null;
}

async function resolveDepartmentUuids(codes: string[]) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("departments")
    .select("id, code")
    .in("code", codes)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  if (!data || data.length !== codes.length) {
    throw new Error("ไม่พบหน่วยงานที่เลือกในระบบ");
  }
  return data;
}

async function syncUserDepartments(userId: string, departmentCodes: string[]) {
  const admin = createAdminClient();
  await admin.from("user_departments").delete().eq("user_id", userId);

  if (departmentCodes.length === 0) return;

  const departments = await resolveDepartmentUuids(departmentCodes);
  const { error } = await admin.from("user_departments").insert(
    departments.map((dept) => ({
      user_id: userId,
      department_id: dept.id,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function createUserFromFields(fields: {
  email: string;
  password: string;
  role: UserRole;
  departmentIds: string[];
}): Promise<ActionResult> {
  const { email, password, role, departmentIds } = fields;

  if (!email || !password) {
    return { ok: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }
  if (password.length < 8) {
    return { ok: false, error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  if (!["user", "manager", "admin"].includes(role)) {
    return { ok: false, error: "บทบาทไม่ถูกต้อง" };
  }

  const deptError = validateDepartments(role, departmentIds);
  if (deptError) return { ok: false, error: deptError };
  const codeError = await validateDepartmentCodes(role, departmentIds);
  if (codeError) return { ok: false, error: codeError };

  try {
    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return { ok: false, error: createError?.message ?? "สร้างผู้ใช้ไม่สำเร็จ" };
    }

    const username = email.split("@")[0] || email;
    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      email,
      username,
      full_name: username,
      role: mapAppRoleToDb(role),
      department_id: null,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { ok: false, error: profileError.message };
    }

    if (role !== "admin") {
      await syncUserDepartments(created.user.id, departmentIds);
    }

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "สร้างผู้ใช้ไม่สำเร็จ" };
  }
}

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user") as UserRole;
  const departmentIds = formData.getAll("departmentIds").map(String);

  return createUserFromFields({ email, password, role, departmentIds });
}

export async function updateUserAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const departmentIds = formData.getAll("departmentIds").map(String);

  if (!userId) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (!["user", "manager", "admin"].includes(role)) {
    return { ok: false, error: "บทบาทไม่ถูกต้อง" };
  }

  const deptError = validateDepartments(role, departmentIds);
  if (deptError) return { ok: false, error: deptError };
  const codeError = await validateDepartmentCodes(role, departmentIds);
  if (codeError) return { ok: false, error: codeError };

  if (userId === auth.adminId && role !== "admin") {
    return { ok: false, error: "ไม่สามารถลดสิทธิ์บัญชีของตนเองได้" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        role: mapAppRoleToDb(role),
        department_id: null,
      })
      .eq("id", userId);

    if (error) return { ok: false, error: error.message };

    if (role === "admin") {
      await admin.from("user_departments").delete().eq("user_id", userId);
    } else {
      await syncUserDepartments(userId, departmentIds);
    }

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId || !password) {
    return { ok: false, error: "กรุณากรอกรหัสผ่านใหม่" };
  }
  if (password.length < 8) {
    return { ok: false, error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ตั้งรหัสผ่านไม่สำเร็จ" };
  }
}

export async function setUserBannedAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const userId = String(formData.get("userId") ?? "");
  const banned = formData.get("banned") === "true";

  if (!userId) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (userId === auth.adminId && banned) {
    return { ok: false, error: "ไม่สามารถระงับบัญชีของตนเองได้" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banned ? "876000h" : "none",
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ" };
  }
}
