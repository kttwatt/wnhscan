"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { DepartmentMultiSelect } from "@/components/auth/department-multi-select";
import { Button } from "@/components/ui/button";
import { PageTabs } from "@/components/ui/page-tabs";
import { PasswordInput } from "@/components/ui/password-input";
import type { DepartmentRow } from "@/lib/auth/departments-db";
import { formatUserRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/client";
import { createUserWithAdminAuthAction } from "./actions";

const ROLES: UserRole[] = ["user", "manager", "admin"];

const LOGIN_TABS = [
  { id: "login", label: "เข้าสู่ระบบ" },
  { id: "create", label: "สร้างผู้ใช้" },
] as const;

type LoginTabId = (typeof LOGIN_TABS)[number]["id"];

type LoginFormProps = {
  departments: DepartmentRow[];
};

export function LoginForm({ departments }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const callbackError = searchParams.get("error");
  const initialTab = searchParams.get("tab") === "create" ? "create" : "login";

  const [activeTab, setActiveTab] = useState<LoginTabId>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError === "auth_callback_failed" ? "การยืนยันตัวตนล้มเหลว กรุณาลองใหม่" : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : signInError.message,
      );
      setLoading(false);
      return;
    }

    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  function handleCreateUser(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createUserWithAdminAuthAction(formData);
      if (result.ok) {
        setMessage("สร้างผู้ใช้สำเร็จ");
        (document.getElementById("create-user-login-form") as HTMLFormElement)?.reset();
        setActiveTab("login");
      } else {
        setError(result.error ?? "สร้างผู้ใช้ไม่สำเร็จ");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page p-6">
      <div className="card-whitespace w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold text-navy-900">WHN-Scan</p>
          <h1 className="mt-2 text-lg font-semibold text-navy-900">
            {activeTab === "login" ? "เข้าสู่ระบบ" : "สร้างผู้ใช้ใหม่"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {activeTab === "login"
              ? "ระบบสแกนบาร์โค้ดเข้าระบบ IPISS"
              : "สำหรับผู้ดูแลระบบ — สร้างบัญชีผู้ใช้ใหม่"}
          </p>
        </div>

        <PageTabs
          tabs={[...LOGIN_TABS]}
          value={activeTab}
          onChange={(id) => {
            setActiveTab(id as LoginTabId);
            setError(null);
            setMessage(null);
          }}
          className="mb-6"
        />

        {message ? (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy-900">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light"
                placeholder="name@hospital.local"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-900">
                รหัสผ่าน
              </label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full disabled:opacity-60"
            >
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </Button>

            <p className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-primary hover:underline"
              >
                ลืมรหัสผ่าน?
              </Link>
            </p>
          </form>
        ) : (
          <form
            id="create-user-login-form"
            action={handleCreateUser}
            className="space-y-4"
          >
            <div className="rounded-lg border border-border bg-surface-page px-3 py-3">
              <p className="text-sm font-medium text-navy-900">ยืนยันตัวตนผู้ดูแลระบบ</p>
              <p className="mt-1 text-xs text-text-secondary">
                กรอกบัญชี admin เพื่ออนุญาตการสร้างผู้ใช้
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="adminEmail" className="mb-1.5 block text-sm font-medium text-navy-900">
                    อีเมลผู้ดูแลระบบ
                  </label>
                  <input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    autoComplete="username"
                    required
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light"
                    placeholder="admin@hospital.local"
                  />
                </div>
                <div>
                  <label htmlFor="adminPassword" className="mb-1.5 block text-sm font-medium text-navy-900">
                    รหัสผ่านผู้ดูแลระบบ
                  </label>
                  <PasswordInput
                    id="adminPassword"
                    name="adminPassword"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="newUserEmail" className="mb-1.5 block text-sm font-medium text-navy-900">
                อีเมลผู้ใช้ใหม่
              </label>
              <input
                id="newUserEmail"
                name="email"
                type="email"
                autoComplete="off"
                required
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light"
                placeholder="name@hospital.local"
              />
            </div>

            <div>
              <label htmlFor="newUserPassword" className="mb-1.5 block text-sm font-medium text-navy-900">
                รหัสผ่านชั่วคราว
              </label>
              <PasswordInput
                id="newUserPassword"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="newUserRole" className="mb-1.5 block text-sm font-medium text-navy-900">
                บทบาท
              </label>
              <select
                id="newUserRole"
                name="role"
                defaultValue="user"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatUserRole(role)}
                  </option>
                ))}
              </select>
            </div>

            <DepartmentMultiSelect name="departmentIds" departments={departments} />

            <Button type="submit" variant="primary" disabled={isPending} className="w-full disabled:opacity-60">
              {isPending ? "กำลังสร้าง…" : "สร้างผู้ใช้"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-text-muted">
          {activeTab === "login"
            ? "บัญชีผู้ใช้จัดการโดยผู้ดูแลระบบ — ลืมรหัสผ่านสามารถรีเซ็ตผ่านอีเมลได้"
            : "ผู้ใช้ใหม่สามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านชั่วคราวที่กำหนด"}
        </p>
      </div>
    </div>
  );
}
