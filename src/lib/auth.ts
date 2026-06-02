// ============================================================================
// نظام المصادقة - كلمة مرور بسيطة
// ============================================================================

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'lawfirm-dz-secret-key-2026'
);

const COOKIE_NAME = 'lawfirm-auth';
const PASSWORD = process.env.APP_PASSWORD || 'saidj2026';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(inputPassword: string): Promise<boolean> {
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
