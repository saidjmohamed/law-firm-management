import { NextResponse } from 'next/server';
import { COOKIE_NAME_EXPORT } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME_EXPORT, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
