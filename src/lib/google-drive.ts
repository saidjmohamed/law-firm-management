import { EncryptJWT, jwtDecrypt } from 'jose';
import prisma from '@/lib/prisma';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];
const TOKEN_ID = 'default';
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

function encryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET غير مضبوط');
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
    .then((hash) => new Uint8Array(hash));
}
export function googleDriveConfig() {
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('يجب ضبط GOOGLE_CLIENT_ID وGOOGLE_CLIENT_SECRET وGOOGLE_REDIRECT_URI');
  }
}
export function googleDriveScopes() { return SCOPES; }
async function encryptToken(refreshToken: string) {
  return new EncryptJWT({ refreshToken }).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt().encrypt(await encryptionKey());
}
async function decryptToken(value: string) {
  const { payload } = await jwtDecrypt(value, await encryptionKey());
  if (typeof payload.refreshToken !== 'string') throw new Error('رمز Google المخزن غير صالح');
  return payload.refreshToken;
}
export async function saveDriveConnection(tokens: { refresh_token?: string; access_token?: string; expires_in?: number; email?: string }) {
  const previous = await prisma.driveConnection.findUnique({ where: { id: TOKEN_ID } });
  const refreshToken = tokens.refresh_token || (previous ? await decryptToken(previous.encryptedRefreshToken) : null);
  if (!refreshToken) throw new Error('لم يرجع Google رمز تحديث. أعد منح صلاحية الوصول مع access_type=offline');
  await prisma.driveConnection.upsert({
    where: { id: TOKEN_ID },
    update: { encryptedRefreshToken: await encryptToken(refreshToken), email: tokens.email || previous?.email || null },
    create: { id: TOKEN_ID, encryptedRefreshToken: await encryptToken(refreshToken), email: tokens.email || null },
  });
}
export async function getDriveSession() {
  const row = await prisma.driveConnection.findUnique({ where: { id: TOKEN_ID } });
  return row ? { connected: true, email: row.email, rootFolderId: row.rootFolderId, rootFolderName: row.rootFolderName } : null;
}
export async function disconnectDrive() {
  await prisma.driveConnection.deleteMany({ where: { id: TOKEN_ID } });
}
export async function setDriveRootFolder(folder: { id: string; name: string }) {
  await prisma.driveConnection.update({ where: { id: TOKEN_ID }, data: { rootFolderId: folder.id, rootFolderName: folder.name } });
}
export async function getDriveAccessToken() {
  googleDriveConfig();
  const row = await prisma.driveConnection.findUnique({ where: { id: TOKEN_ID } });
  if (!row) throw new Error('Google Drive غير مربوط');
  const refreshToken = await decryptToken(row.encryptedRefreshToken);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId!, client_secret: clientSecret!, refresh_token: refreshToken, grant_type: 'refresh_token' }),
    cache: 'no-store',
  });
  const tokens = await response.json();
  if (!response.ok) throw new Error(tokens.error_description || 'تعذر تجديد اتصال Google Drive');
  return tokens.access_token as string;
}
export async function driveApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await getDriveAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init, cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'فشل طلب Google Drive');
  return body as T;
}
export async function createDriveFolder(name: string, parentId: string) {
  return driveApi<{id:string;name:string}>('files?fields=id,name', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  });
}
async function ensureFolder(name: string, parentId: string) {
  const q = encodeURIComponent(`'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const result = await driveApi<{files:Array<{id:string;name:string}>}>(`files?q=${q}&pageSize=100&fields=files(id,name)`);
  return result.files[0] || createDriveFolder(name, parentId);
}
export async function queueDriveSync(entityType: 'client'|'case', entityId: number, eventType: string) {
  const dedupeKey = `${entityType}:${entityId}:${eventType}:${Math.floor(Date.now()/30000)}`;
  await prisma.driveSyncJob.upsert({
    where: { dedupeKey },
    update: { status: 'pending', runAfter: new Date() },
    create: { entityType, entityId, eventType, dedupeKey },
  });
}
function md(v: unknown) { return v === null || v === undefined || v === '' ? '—' : String(v).replace(/[<>]/g, ''); }
function date(v: Date | null | undefined) { return v ? new Date(v).toLocaleDateString('ar-DZ') : '—'; }
async function upsertMarkdown(folderId: string, name: string, marker: string, content: string) {
  const q = encodeURIComponent(`'${folderId}' in parents and name='${name}' and trashed=false`);
  const found = await driveApi<{files:Array<{id:string;appProperties?:Record<string,string>}>}>(`files?q=${q}&pageSize=100&fields=files(id,appProperties)`);
  const existing = found.files.find((x) => x.appProperties?.lawfirmManaged === marker);
  const accessToken = await getDriveAccessToken();
  if (existing) {
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'text/markdown; charset=utf-8' }, body: content,
    });
    if (!res.ok) throw new Error('تعذر تحديث ملف Markdown في Drive');
    return existing.id;
  }
  const boundary = 'lawfirm_markdown_boundary';
  const metadata = { name, mimeType: 'text/markdown', parents: [folderId], appProperties: { lawfirmManaged: marker } };
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/markdown; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error?.message || 'تعذر إنشاء ملف Markdown');
  return result.id as string;
}
export async function syncClientToDrive(clientId: number) {
  const connection = await prisma.driveConnection.findUnique({ where: { id: TOKEN_ID } });
  if (!connection?.rootFolderId) throw new Error('يجب اختيار مجلد الأرشيف الرئيسي أولاً');
  const client = await prisma.client.findUnique({ where: { id: clientId }, include: { cases: true } });
  if (!client) throw new Error('الموكل غير موجود');
  const folder = await ensureFolder(`موكل-${client.id}-${client.name || 'بدون اسم'}`, connection.rootFolderId);
  await prisma.driveEntityLink.upsert({ where: { entityType_entityId: { entityType: 'client', entityId: client.id } }, update: { folderId: folder.id, folderName: folder.name }, create: { entityType: 'client', entityId: client.id, folderId: folder.id, folderName: folder.name } });
  const content = `# معلومات الموكل\n\n- الاسم: ${md(client.name)}\n- الهاتف: ${md(client.phone)}\n- هاتف إضافي: ${md(client.phone2)}\n- العنوان: ${md(client.address)}\n- الولاية: ${md(client.wilaya)}\n- ملاحظات: ${md(client.notes)}\n\n## القضايا المرتبطة\n${client.cases.map(c => `- ${md(c.caseNumber)} — ${md(c.subject)}`).join('\n') || 'لا توجد قضايا'}\n`;
  await upsertMarkdown(folder.id, 'معلومات الموكل.md', `client:${client.id}`, content);
  for (const c of client.cases) await queueDriveSync('case', c.id, 'client-sync');
}
export async function syncCaseToDrive(caseId: number) {
  const c = await prisma.case.findUnique({ where: { id: caseId }, include: { client: true, parties: true, delays: true, sessions: true, payments: true, tasks: true } });
  if (!c) throw new Error('القضية غير موجودة');
  let parentId: string;
  if (c.clientId) {
    const link = await prisma.driveEntityLink.findUnique({ where: { entityType_entityId: { entityType: 'client', entityId: c.clientId } } });
    if (link) parentId = link.folderId;
    else { await syncClientToDrive(c.clientId); const created = await prisma.driveEntityLink.findUnique({ where: { entityType_entityId: { entityType: 'client', entityId: c.clientId } } }); if (!created) throw new Error('تعذر إنشاء مجلد الموكل'); parentId = created.folderId; }
  } else {
    const root = await prisma.driveConnection.findUnique({ where: { id: TOKEN_ID } });
    if (!root?.rootFolderId) throw new Error('يجب اختيار مجلد الأرشيف الرئيسي أولاً');
    parentId = root.rootFolderId;
  }
  const folder = await ensureFolder(`قضية-${c.id}-${c.caseNumber || c.subject || 'بدون رقم'}`, parentId);
  for (const sub of ['الوثائق', 'الأحكام والقرارات', 'المحاضر والأدلة', 'المراسلات']) await ensureFolder(sub, folder.id);
  const fileId = await upsertMarkdown(folder.id, 'القضية.md', `case:${c.id}`,
    `# ملف القضية ${md(c.caseNumber)}\n\n## البيانات الأساسية\n- الموضوع: ${md(c.subject)}\n- الطبيعة: ${md(c.caseNature)}\n- المرحلة: ${md(c.litigationStage)}\n- الحالة: ${md(c.status)}\n- تاريخ التسجيل: ${date(c.registrationDate)}\n\n## الموكل\n- الاسم: ${md(c.client?.name)}\n- الهاتف: ${md(c.client?.phone)}\n\n## الجهة القضائية\n- الولاية: ${md(c.wilayaId)}\n- المجلس: ${md(c.councilName)}\n- المحكمة: ${md(c.courtName)}\n- القسم: ${md(c.chamber)}\n\n## الأطراف\n${c.parties.map(p => `- ${md(p.name)} — ${md(p.role)} — ${p.side === 'against' ? 'ضده' : 'في حقه'}`).join('\n') || 'لا يوجد'}\n\n## الجلسات\n${c.sessions.map(s => `- ${date(s.date)} — ${md(s.result)} — ${md(s.notes)}`).join('\n') || 'لا توجد جلسات'}\n\n## التأجيلات\n${c.delays.map(d => `- ${date(d.delayDate)} — ${md(d.reason)} — ${md(d.notes)}`).join('\n') || 'لا توجد تأجيلات'}\n\n## الحكم\n- المنطوق: ${md(c.judgment)}\n- التاريخ: ${date(c.judgmentDate)}\n- النتيجة: ${md(c.caseResult)}\n\n## المهام والإجراءات\n${c.tasks.map(t => `- ${md(t.title)} — ${md(t.status)} — ${date(t.legalDeadline || t.dueDate)}`).join('\n') || 'لا توجد مهام'}\n\n## الملاحظات\n${md(c.notes)}\n`);
  await prisma.driveEntityLink.upsert({ where: { entityType_entityId: { entityType: 'case', entityId: c.id } }, update: { folderId: folder.id, folderName: folder.name, markdownId: fileId }, create: { entityType: 'case', entityId: c.id, folderId: folder.id, folderName: folder.name, markdownId: fileId } });
}
export async function processDriveSyncQueue(limit = 20) {
  const jobs = await prisma.driveSyncJob.findMany({ where: { status: { in: ['pending','failed'] }, runAfter: { lte: new Date() }, attempts: { lt: 8 } }, orderBy: { createdAt: 'asc' }, take: limit });
  for (const job of jobs) {
    const claimed = await prisma.driveSyncJob.updateMany({ where: { id: job.id, status: { in: ['pending','failed'] } }, data: { status: 'processing', attempts: { increment: 1 } } });
    if (!claimed.count) continue;
    try {
      if (job.entityType === 'client') await syncClientToDrive(job.entityId);
      else if (job.entityType === 'case') await syncCaseToDrive(job.entityId);
      await prisma.driveSyncJob.update({ where: { id: job.id }, data: { status: 'done', lastError: null } });
    } catch (error) {
      const attempts = job.attempts + 1;
      await prisma.driveSyncJob.update({ where: { id: job.id }, data: { status: 'failed', lastError: error instanceof Error ? error.message : 'خطأ مزامنة غير معروف', runAfter: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000) } });
    }
  }
  return { processed: jobs.length };
}
