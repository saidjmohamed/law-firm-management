import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createToken, COOKIE_NAME_EXPORT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'كلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password);

    if (!isValid) {
      // تأخير بسيط لمنع brute-force (200ms)
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    let token: string;
    try {
      token = await createToken();
    } catch {
      // AUTH_SECRET غير معرّف
      return NextResponse.json(
        { error: 'إعداد الخادم غير مكتمل: AUTH_SECRET مفقود' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME_EXPORT, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
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
