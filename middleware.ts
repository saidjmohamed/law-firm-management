import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const COOKIE_NAME = 'lawfirm-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح بالوصول لصفحة تسجيل الدخول و API المصادقة
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
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
