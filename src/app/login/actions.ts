"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createUserFromFields } from "@/app/(dashboard)/admin/users/actions";
import type { UserRole } from "@/lib/auth/types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Ephemeral client — does not read or write session cookies. */
function createEphemeralAuthClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createUserWithAdminAuthAction(formData: FormData): Promise<ActionResult> {
  const adminEmail = String(formData.get("adminEmail") ?? "").trim().toLowerCase();
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user") as UserRole;
  const departmentIds = formData.getAll("departmentIds").map(String);

  if (!adminEmail || !adminPassword) {
    return { ok: false, error: "กรุณากรอกอีเมลและรหัสผ่านผู้ดูแลระบบ" };
  }

  const ephemeral = createEphemeralAuthClient();
  const { data: authData, error: authError } = await ephemeral.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError || !authData.user) {
    return {
      ok: false,
      error:
        authError?.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง"
          : (authError?.message ?? "ยืนยันตัวตนผู้ดูแลระบบไม่สำเร็จ"),
    };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  await ephemeral.auth.signOut();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, error: "ไม่มีสิทธิ์สร้างผู้ใช้ — ต้องเป็นผู้ดูแลระบบ (admin)" };
  }

  return createUserFromFields({ email, password, role, departmentIds });
}
