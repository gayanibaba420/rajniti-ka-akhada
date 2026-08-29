import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const ADMIN_PAGE = /^\/admin(\/|$)/;
const ADMIN_API = /^\/api\/admin(\/|$)/;
const AUTH_API = /^\/api\/auth\/(login|logout|me)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTH_API.test(pathname)) {
    return NextResponse.next();
  }

  if (ADMIN_API.test(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "लॉगिन आवश्यक" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: "सत्र समाप्त" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (ADMIN_PAGE.test(pathname) && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const session = await verifySession(token);
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};