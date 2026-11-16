import { requireDriveAuth } from '@/lib/drive-auth';
import { NextResponse } from 'next/server';
import { googleDriveConfig, googleDriveScopes } from '@/lib/google-drive';
import { randomBytes } from 'crypto';
export const runtime = 'nodejs';
export async function GET() {
  const denied = await requireDriveAuth(); if (denied) return denied;
  try {
    googleDriveConfig();
    const state = randomBytes(24).toString('hex');
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code', scope: googleDriveScopes().join(' '), access_type: 'offline',
      prompt: 'consent', include_granted_scopes: 'true', state,
    }).toString();
    const response = NextResponse.redirect(url);
    response.cookies.set('lawfirm-google-state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطأ في إعداد Google Drive' }, { status: 500 });
  }
}
