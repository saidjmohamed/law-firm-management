// ============================================================================
// نظام المصادقة - كلمة مرور بسيطة
// ============================================================================

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'lawfirm-auth';

// قراءة الأسرار من البيئة - لا قيم افتراضية (يجب أن تُعرف في Vercel)
const AUTH_SECRET = process.env.AUTH_SECRET;
const PASSWORD = process.env.APP_PASSWORD;

if (!AUTH_SECRET) {
  console.error('[auth] AUTH_SECRET غير معرّف في متغيرات البيئة');
}
if (!PASSWORD) {
  console.error('[auth] APP_PASSWORD غير معرّف في متغيرات البيئة');
}

const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET ?? 'FALLBACK_INSECURE_DEV_ONLY_DO_NOT_USE_IN_PRODUCTION');

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(inputPassword: string): Promise<boolean> {
  if (!PASSWORD) return false; // رفض الدخول إذا لم تُعرف كلمة المرور في البيئة
  return inputPassword === PASSWORD;
}

export async function createToken(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  if (!AUTH_SECRET) return false; // رفض التحقق إذا لم يُعرف السر
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function getAuthStatus(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return await verifyToken(token);
  } catch {
    return false;
  }
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
