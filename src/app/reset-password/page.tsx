"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(Boolean(session));
      setCheckingSession(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page">
        <p className="text-sm text-text-secondary">กำลังตรวจสอบ…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page p-6">
        <div className="card-whitespace w-full max-w-md text-center">
          <h1 className="text-lg font-semibold text-navy-900">ลิงก์หมดอายุหรือไม่ถูกต้อง</h1>
          <p className="mt-2 text-sm text-text-secondary">
            กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block text-sm font-medium text-blue-primary hover:underline"
          >
            ขอลิงก์ตั้งรหัสผ่านใหม่
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page p-6">
      <div className="card-whitespace w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold text-navy-900">WNH Scan</p>
          <h1 className="mt-2 text-lg font-semibold text-navy-900">ตั้งรหัสผ่านใหม่</h1>
          <p className="mt-1 text-sm text-text-secondary">กรอกรหัสผ่านใหม่ของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-900">
              รหัสผ่านใหม่
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-navy-900"
            >
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full disabled:opacity-60"
          >
            {loading ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-page">
          <p className="text-sm text-text-secondary">กำลังโหลด…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
