"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (retryAfter && retryAfter > Date.now()) {
      setError("ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่");
      return;
    }
    setError(null);
    setLoading(true);

    const resetResponse = await fetch("/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const resetResult = (await resetResponse.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      retryAfterSeconds?: number;
    };

    setLoading(false);

    if (!resetResponse.ok || resetResult.ok === false) {
      if (resetResponse.status === 429) {
        const retryAfterSeconds = resetResult.retryAfterSeconds ?? 60;
        setRetryAfter(Date.now() + retryAfterSeconds * 1000);
      }
      setError(resetResult.error ?? "ส่งลิงก์ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page p-6">
      <div className="card-whitespace w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold text-navy-900">WHN-Scan</p>
          <h1 className="mt-2 text-lg font-semibold text-navy-900">ลืมรหัสผ่าน</h1>
          <p className="mt-1 text-sm text-text-secondary">
            กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ทางอีเมล
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
              หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว กรุณาตรวจสอบกล่องจดหมาย
            </p>
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-blue-primary hover:underline"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? "กำลังส่งลิงก์…" : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
            </Button>

            <p className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-primary hover:underline"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
