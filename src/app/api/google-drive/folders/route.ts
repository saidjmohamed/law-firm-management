import { NextRequest, NextResponse } from 'next/server';
import { driveApi, getDriveAccessToken, DRIVE_COOKIE_NAME, DRIVE_COOKIE_OPTIONS } from '@/lib/google-drive';
export async function GET(request: NextRequest) {
  try {
    const parent = request.nextUrl.searchParams.get('parent');
    const q = parent ? `'${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false` : `'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const data = await driveApi<{files:Array<{id:string;name:string;mimeType:string}>;nextPageToken?:string}>(`files?q=${encodeURIComponent(q)}&pageSize=100&orderBy=name&fields=files(id,name,mimeType),nextPageToken`);
    const response = NextResponse.json(data);
    const session = await getDriveAccessToken();
    if (session.refreshedCookie) response.cookies.set(DRIVE_COOKIE_NAME, session.refreshedCookie, DRIVE_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر عرض المجلدات' }, { status: 400 });
  }
}
