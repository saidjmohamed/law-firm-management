import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح بالوصول لصفحة تسجيل الدخول و API المصادقة و MCP Server
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/mcp")
  ) {
    return NextResponse.next();
  }

  // السماح بالملفات الثابتة
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // التحقق من وجود كوكي المصادقة فقط
  const hasAuth = request.cookies.has("lawfirm-auth");

  if (!hasAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
