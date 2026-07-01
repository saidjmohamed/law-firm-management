import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createToken, COOKIE_NAME_EXPORT } from '@/lib/auth';

// ============================================================================
// حماية بسيطة من هجمات التخمين (brute-force) — عداد محاولات في الذاكرة
// ملاحظة: هذا حل دفاعي أساسي فقط. في بيئة serverless متعددة النسخ (مثل Vercel)
// لا يضمن هذا العداد تتبعاً كاملاً عبر كل النسخ، لكنه يرفع تكلفة الهجوم بشكل
// ملموس ويحمي من المحاولات المتكررة السريعة من نفس النسخة/IP. لحماية أقوى
// وموثوقة عبر كل النسخ، يُنصح بربط Vercel KV أو خدمة مشابهة لاحقاً.
// ============================================================================
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
const attempts = new Map<string, { count: number; firstAttempt: number }>();

function getClientKey(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record) return false;
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function clearAttempts(key: string): void {
  attempts.delete(key);
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);

    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: 'محاولات كثيرة جداً. حاول مرة أخرى بعد 15 دقيقة' },
        { status: 429 }
      );
    }

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
      recordFailedAttempt(clientKey);
      // تأخير بسيط لمنع brute-force (200ms)
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    clearAttempts(clientKey);

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
