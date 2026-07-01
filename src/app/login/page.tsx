import { Suspense } from "react";
import { listDepartmentsAdmin } from "@/lib/auth/departments-db.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  let departments: Awaited<ReturnType<typeof listDepartmentsAdmin>> = [];

  if (isSupabaseConfigured()) {
    try {
      departments = await listDepartmentsAdmin();
    } catch {
      departments = [];
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-page">
          <p className="text-sm text-text-secondary">กำลังโหลด…</p>
        </div>
      }
    >
      <LoginForm departments={departments} />
    </Suspense>
  );
}
