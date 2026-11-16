import { NextRequest, NextResponse } from 'next/server';
import { googleDriveConfig, saveDriveConnection } from '@/lib/google-drive';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    googleDriveConfig();
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    if (!code || !state || state !== request.cookies.get('lawfirm-google-state')?.value) {
      return NextResponse.redirect(new URL('/?drive=oauth_error', request.url));
    }
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: process.env.GOOGLE_REDIRECT_URI!, grant_type: 'authorization_code' }), cache: 'no-store',
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokens.error_description || 'فشل تفويض Google');
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: 'no-store' });
    const profile = profileResponse.ok ? await profileResponse.json() : {};
    await saveDriveConnection({ ...tokens, email: profile.email });
    const result = NextResponse.redirect(new URL('/?drive=connected', request.url));
    result.cookies.delete('lawfirm-google-state');
    return result;
  } catch (error) {
    console.error('Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/?drive=oauth_error', request.url));
  }
}
