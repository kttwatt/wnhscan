import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  const redirectTo = `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(
    "/reset-password",
  )}`;

  if (!email?.trim()) {
    return NextResponse.json({ ok: false, error: "กรุณากรอกอีเมล" }, { status: 400 });
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

  if (error) {
    if (error.message.toLowerCase().includes("rate limit")) {
      return NextResponse.json(
        {
          ok: false,
          error: "ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่ หรือติดต่อผู้ดูแลระบบให้ตั้งรหัสผ่านใหม่",
          retryAfterSeconds: 60,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return response;
}
