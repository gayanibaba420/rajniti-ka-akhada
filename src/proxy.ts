import { NextRequest, NextResponse } from "next/server";
import { categories } from "@/lib/data";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const categoryMatch = pathname.match(/^\/category\/([^/?]+)/);
  if (categoryMatch && !categories.some((category) => category.slug === categoryMatch[1])) {
    return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const configuredUser = process.env.ADMIN_USER;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  // Development fallback intentionally avoids shipping a hard-coded production secret.
  // Production fails closed until both credentials are configured.
  if (process.env.NODE_ENV !== "production" && (!configuredUser || !configuredPassword)) {
    return NextResponse.next();
  }
  if (!configuredUser || !configuredPassword) {
    return new NextResponse("Admin authentication is not configured.", { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const [user, password] = atob(authorization.slice(6)).split(":");
      if (user === configuredUser && password === configuredPassword) return NextResponse.next();
    } catch {
      // Invalid authorization values are challenged below.
    }
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Rajniti CMS", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/admin/:path*", "/category/:path*"] };
