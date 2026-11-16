import { cookies } from 'next/headers';
import { EncryptJWT, jwtDecrypt } from 'jose';

const COOKIE = 'lawfirm-google-drive';
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'];
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
const secret = process.env.AUTH_SECRET;

function key() {
  if (!secret) throw new Error('AUTH_SECRET غير مضبوط');
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
    .then((hash) => new Uint8Array(hash));
}
async function seal(payload: Record<string, unknown>) {
  return new EncryptJWT(payload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt().setExpirationTime('90d').encrypt(await key());
}
async function open(token: string) {
  const { payload } = await jwtDecrypt(token, await key());
  return payload as { refreshToken?: string; accessToken?: string; expiresAt?: number; email?: string };
}
export function googleDriveConfig() {
  if (!clientId || !clientSecret || !redirectUri) throw new Error('يجب ضبط GOOGLE_CLIENT_ID وGOOGLE_CLIENT_SECRET وGOOGLE_REDIRECT_URI');
}
export function googleDriveScopes() { return SCOPES; }
export async function createDriveCookie(tokens: { refresh_token?: string; access_token?: string; expires_in?: number; email?: string }, previous?: string) {
  const old = previous ? await open(previous).catch(() => ({})) : {};
  const refreshToken = tokens.refresh_token || old.refreshToken;
  if (!refreshToken) throw new Error('لم يرجع Google رمز تحديث؛ أعد منح صلاحية الوصول مع access_type=offline');
  return seal({
    refreshToken,
    accessToken: tokens.access_token || old.accessToken,
    expiresAt: Date.now() + ((tokens.expires_in || 0) * 1000),
    email: tokens.email || old.email,
  });
}
export async function getDriveSession() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return null;
  try {
    const data = await open(value);
    return { connected: true, email: data.email || null };
  } catch { return null; }
}
export async function getDriveAccessToken() {
  googleDriveConfig();
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) throw new Error('Google Drive غير مربوط');
  const data = await open(value);
  if (data.accessToken && data.expiresAt && data.expiresAt > Date.now() + 60000) {
    return { accessToken: data.accessToken, refreshedCookie: null as string | null };
  }
  if (!data.refreshToken) throw new Error('جلسة Google Drive غير صالحة؛ أعد الربط');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId!, client_secret: clientSecret!, refresh_token: data.refreshToken, grant_type: 'refresh_token' }),
    cache: 'no-store',
  });
  const tokens = await response.json();
  if (!response.ok) throw new Error(tokens.error_description || 'تعذر تجديد اتصال Google Drive');
  const refreshedCookie = await seal({ ...data, accessToken: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 });
  return { accessToken: tokens.access_token as string, refreshedCookie };
}
export const DRIVE_COOKIE_NAME = COOKIE;
export const DRIVE_COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 90 };
export async function driveApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { accessToken } = await getDriveAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init, cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'فشل طلب Google Drive');
  return body as T;
}
export async function findOrCreateCaseMarkdown(caseId: number, folderId: string, content: string) {
  const q = encodeURIComponent(`'${folderId}' in parents and name='القضية.md' and trashed=false`);
  const found = await driveApi<{ files: Array<{id:string; appProperties?:Record<string,string>}> }>(`files?q=${q}&fields=files(id,appProperties)&pageSize=10`);
  let file = found.files?.find((item) => item.appProperties?.lawfirmCaseId === String(caseId)) || found.files?.[0];
  const metadata = { name: 'القضية.md', mimeType: 'text/markdown', parents: [folderId], appProperties: { lawfirmCaseId: String(caseId), managedBy: 'law-firm-management' } };
  if (file) {
    return driveApi(`files/${file.id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'text/markdown; charset=utf-8' }, body: content });
  }
  const boundary = 'lawfirm_drive_boundary';
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/markdown; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;
  const { accessToken } = await getDriveAccessToken();
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body, cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'تعذر إنشاء ملف القضية.md');
  return result;
}
