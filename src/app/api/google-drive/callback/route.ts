import { NextRequest, NextResponse } from 'next/server';
import { createDriveCookie, DRIVE_COOKIE_NAME, DRIVE_COOKIE_OPTIONS, googleDriveConfig } from '@/lib/google-drive';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    googleDriveConfig();
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    if (!code || !state || state !== request.cookies.get('lawfirm-google-state')?.value) {
      return NextResponse.redirect(new URL('/?drive=oauth_error', request.url));
    }
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: process.env.GOOGLE_REDIRECT_URI!, grant_type: 'authorization_code' }),
      cache: 'no-store',
    });
    const tokens = await response.json();
    if (!response.ok) throw new Error(tokens.error_description || 'فشل تفويض Google');
    const cookie = await createDriveCookie(tokens);
    const result = NextResponse.redirect(new URL('/?drive=connected', request.url));
    result.cookies.set(DRIVE_COOKIE_NAME, cookie, DRIVE_COOKIE_OPTIONS);
    result.cookies.delete('lawfirm-google-state');
    return result;
  } catch (error) {
    console.error('Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/?drive=oauth_error', request.url));
  }
}
