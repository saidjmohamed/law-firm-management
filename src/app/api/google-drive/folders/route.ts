import { requireDriveAuth } from '@/lib/drive-auth';
import { NextRequest, NextResponse } from 'next/server';
import { driveApi, setDriveRootFolder } from '@/lib/google-drive';
export async function GET(request: NextRequest) {
  const denied = await requireDriveAuth(); if (denied) return denied;
  try {
    const parent = request.nextUrl.searchParams.get('parent') || 'root';
    const q = `'${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const data = await driveApi<{files:Array<{id:string;name:string;mimeType:string}>;nextPageToken?:string}>(`files?q=${encodeURIComponent(q)}&pageSize=100&orderBy=name&fields=files(id,name,mimeType),nextPageToken`);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر عرض المجلدات' }, { status: 400 });
  }
}
export async function POST(request: NextRequest) {
  const denied = await requireDriveAuth(); if (denied) return denied;
  try {
    const { folderId } = await request.json();
    if (typeof folderId !== 'string' || !folderId) return NextResponse.json({ error: 'معرّف المجلد مطلوب' }, { status: 400 });
    const folder = await driveApi<{id:string;name:string;mimeType:string}>(`files/${encodeURIComponent(folderId)}?fields=id,name,mimeType`);
    if (folder.mimeType !== 'application/vnd.google-apps.folder') return NextResponse.json({ error: 'العنصر المحدد ليس مجلداً' }, { status: 400 });
    await setDriveRootFolder(folder);
    return NextResponse.json({ success: true, folder });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر حفظ المجلد الرئيسي' }, { status: 400 });
  }
}
