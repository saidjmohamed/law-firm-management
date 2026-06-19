// ============================================================================
// نظام المصادقة — Admin مفرد (Single Admin User)
// ============================================================================
// الأسرار تُقرأ من متغيرات البيئة فقط. لا قيم افتراضية. لا hardcoded secrets.
// إذا لم تُعرَّف الأسرار اللازمة، يُرفض الدخول تلقائياً (fail-closed).
//
// متغيرات البيئة المطلوبة:
//   AUTH_SECRET     — مفتاح توقيع JWT (طوّله: openssl rand -base64 32)
//   APP_PASSWORD    — كلمة مرور المسؤول (نص واضح) — بديل مبسّط
// أو:
//   APP_PASSWORD_HASH — SHA-256 hex لكلمة المرور (أكثر أماناً)
// ============================================================================

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'lawfirm-auth';
const TOKEN_TTL_DAYS = 30;

// قراءة الأسرار من البيئة فقط
const AUTH_SECRET = process.env.AUTH_SECRET;
const APP_PASSWORD = process.env.APP_PASSWORD;
const APP_PASSWORD_HASH = process.env.APP_PASSWORD_HASH;

// ============================================================================
// التحقق من وجود الأسرار اللازمة في وقت الإقلاع
// (لا نطرح استثناء في SSR لأن middleware يحمي المسارات — لكن نسجّل خطأ واضحاً)
// ============================================================================
function warnMissingEnvVar(name: string) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[auth] ${name} غير معرّف. المصادقة ستفشل حتى يُعرف.`);
  }
}

if (!AUTH_SECRET) warnMissingEnvVar('AUTH_SECRET');
if (!APP_PASSWORD && !APP_PASSWORD_HASH) {
  warnMissingEnvVar('APP_PASSWORD أو APP_PASSWORD_HASH');
}

// مفتاح التوقيع — يجب أن يكون موجوداً
const SECRET_KEY = AUTH_SECRET
  ? new TextEncoder().encode(AUTH_SECRET)
  : null;

// ============================================================================
// أدوات تشفير مساعدة
// ============================================================================

/** حساب SHA-256 hex لكلمة مرور (لاستخدامها كـ APP_PASSWORD_HASH) */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** مقارنة ثابتة الزمن لمنع هجمات التوقيت (timing attacks) */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================================================
// التحقق من كلمة المرور
// ============================================================================
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  if (!inputPassword) return false;

  // المسار 1: كلمة مرور مشفّرة (مُفضّل)
  if (APP_PASSWORD_HASH) {
    const inputHash = await hashPassword(inputPassword);
    return constantTimeEqual(inputHash, APP_PASSWORD_HASH);
  }

  // المسار 2: كلمة مرور نصية (للتطوير/التبسيط)
  if (APP_PASSWORD) {
    return constantTimeEqual(inputPassword, APP_PASSWORD);
  }

  // لا توجد كلمة مرور مُعرّفة → رفض دائم
  return false;
}

// ============================================================================
// JWT Token
// ============================================================================
export async function createToken(): Promise<string> {
  if (!SECRET_KEY) {
    throw new Error('AUTH_SECRET غير معرّف — لا يمكن إنشاء توكن');
  }
  const token = await new SignJWT({
    authenticated: true,
    role: 'admin',       // نظام مسؤول مفرد
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_DAYS}d`)
    .sign(SECRET_KEY);
  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  if (!SECRET_KEY) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.authenticated === true && payload.role === 'admin';
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
