import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/reset-password",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next") || "/";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = next.startsWith("/") ? next : "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
