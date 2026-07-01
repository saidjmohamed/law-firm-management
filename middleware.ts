import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'lawfirm-auth';

/** التحقق من JWT token — متوافق مع Edge Runtime */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const AUTH_SECRET = process.env.AUTH_SECRET;
    if (!AUTH_SECRET) return false;
    const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.authenticated === true && payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // السماح بالوصول لصفحة تسجيل الدخول و API المصادقة و MCP Server
    if (pathname === '/login' || pathname.startsWith('/api/auth') || pathname.startsWith('/api/mcp')) {
      return NextResponse.next();
    }

    // السماح بالملفات الثابتة
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.') // ملفات ثابتة مثل .png, .svg, etc.
    ) {
      return NextResponse.next();
    }

    // التحقق من المصادقة
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const isAuthenticated = await verifyToken(token);

    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // في حالة فشل middleware، نسمح بالمرور ونترك API يتعامل مع المصادقة
    console.error('[middleware] Error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * تطابق جميع المسارات ما عدا:
     * - _next/static (ملفات ثابتة)
     * - _next/image (تحسين الصور)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
