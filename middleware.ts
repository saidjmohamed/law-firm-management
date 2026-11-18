import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "lawfirm-auth";

async function hasValidAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );
    return payload.authenticated === true && payload.role === "admin";
  } catch {
    return false;
  }
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // مسارات المصادقة وواجهة MCP لها آلياتها الخاصة.
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/mcp")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|json)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authenticated = await hasValidAdminToken(request);

  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return clearAuthCookie(NextResponse.next());
  }

  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return clearAuthCookie(
        NextResponse.json({ error: "غير مصرح. يرجى تسجيل الدخول." }, { status: 401 })
      );
    }
    return clearAuthCookie(NextResponse.redirect(new URL("/login", request.url)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
