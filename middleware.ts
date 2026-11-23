import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
const AUTH_SECRET = process.env.AUTH_SECRET;
const SECRET_KEY = AUTH_SECRET ? new TextEncoder().encode(AUTH_SECRET) : null;

async function verifyAuthToken(token: string | undefined): Promise<boolean> {
  if (!token || !SECRET_KEY) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload.authenticated === true && payload.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("lawfirm-auth")?.value;
  const hasAuth = await verifyAuthToken(authToken);

  if (pathname === "/login") {
    if (hasAuth) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const response = NextResponse.next();
    if (authToken) {
      response.cookies.delete("lawfirm-auth");
    }
    return response;
  }

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/mcp")
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|json)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (!hasAuth) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (authToken) {
      response.cookies.delete("lawfirm-auth");
    }
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
