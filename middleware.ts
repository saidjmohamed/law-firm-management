import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'lawfirm-auth';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح بالوصول لصفحة تسجيل الدخول و API المصادقة و MCP Server
  if (pathname === '/login' || pathname.startsWith('/api/auth') || pathname.startsWith('/api/mcp')) {
    return NextResponse.next();
  }

  // السماح بالملفات الثابتة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // التحقق من وجود كوكي المصادقة فقط (التحقق الفعلي يتم في API routes)
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
