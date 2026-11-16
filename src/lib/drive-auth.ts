import { NextResponse } from 'next/server';
import { getAuthStatus } from '@/lib/auth';
export async function requireDriveAuth() {
  if (await getAuthStatus()) return null;
  return NextResponse.json({ error: 'غير مصرح. يرجى تسجيل الدخول من جديد.' }, { status: 401 });
}
