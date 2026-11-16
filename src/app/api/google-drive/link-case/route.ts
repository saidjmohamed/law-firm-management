import { NextRequest, NextResponse } from 'next/server';
import { driveApi, getDriveAccessToken, DRIVE_COOKIE_NAME, DRIVE_COOKIE_OPTIONS, findOrCreateCaseMarkdown } from '@/lib/google-drive';
import prisma from '@/lib/prisma';
export async function POST(request: NextRequest) {
  try {
    const { caseId, folderId } = await request.json();
    if (!Number.isInteger(Number(caseId)) || !folderId) return NextResponse.json({error:'بيانات الربط غير مكتملة'}, {status:400});
    const folder = await driveApi<{id:string;name:string;mimeType:string}>(`files/${encodeURIComponent(folderId)}?fields=id,name,mimeType`);
    if (folder.mimeType !== 'application/vnd.google-apps.folder') return NextResponse.json({error:'العنصر المحدد ليس مجلداً'}, {status:400});
    const caseData = await prisma.case.findUnique({where:{id:Number(caseId)},include:{client:true,parties:true,delays:true,sessions:true,payments:true,tasks:true}});
    if (!caseData) return NextResponse.json({error:'القضية غير موجودة'}, {status:404});
    const content = buildCaseMarkdown(caseData);
    const file = await findOrCreateCaseMarkdown(caseData.id, folder.id, content);
    const response = NextResponse.json({success:true,folderName:folder.name,folderId:folder.id,file});
    const session = await getDriveAccessToken();
    if (session.refreshedCookie) response.cookies.set(DRIVE_COOKIE_NAME,session.refreshedCookie,DRIVE_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    return NextResponse.json({error:error instanceof Error?error.message:'فشل ربط المجلد'}, {status:500});
  }
}
function buildCaseMarkdown(c:any) {
  const date=(v:any)=>v?new Date(v).toLocaleDateString('ar-DZ'):'—';
  const val=(v:any)=>v===null||v===undefined||v===''?'—':String(v);
  return `# ملف القضية ${val(c.caseNumber)}\n\n> آخر تحديث: ${new Date().toLocaleString('ar-DZ')}\n\n## البيانات الأساسية\n- رقم القضية: ${val(c.caseNumber)}\n- الموضوع: ${val(c.subject)}\n- طبيعة القضية: ${val(c.caseNature)}\n- المرحلة: ${val(c.litigationStage)}\n- الحالة: ${val(c.status)}\n- تاريخ التسجيل: ${date(c.registrationDate)}\n\n## الموكل\n- الاسم: ${val(c.client?.name)}\n- الهاتف: ${val(c.client?.phone)}\n- العنوان: ${val(c.client?.address)}\n\n## الجهة القضائية\n- الولاية: ${val(c.wilayaId)}\n- نوع الجهة: ${val(c.judiciaryType)}\n- المجلس: ${val(c.councilName)}\n- المحكمة: ${val(c.courtName)}\n- القسم: ${val(c.chamber)}\n\n## الخصوم والأطراف\n${(c.parties||[]).map((p:any)=>`- ${val(p.name)} — ${val(p.role)} — ${p.side==='against'?'ضده':'في حقه'} — هاتف: ${val(p.phone)}`).join('\n')||'لا توجد أطراف مسجلة'}\n\n## الجلسات\n${(c.sessions||[]).map((s:any)=>`- ${date(s.date)} — ${val(s.court)} — ${val(s.chamber)} — النتيجة: ${val(s.result)} — ملاحظات: ${val(s.notes)}`).join('\n')||'لا توجد جلسات مسجلة'}\n\n## التأجيلات\n${(c.delays||[]).map((d:any)=>`- ${date(d.delayDate)} — ${val(d.reason)} — ${val(d.notes)}`).join('\n')||'لا توجد تأجيلات مسجلة'}\n\n## الحكم والنتيجة\n- منطوق الحكم: ${val(c.judgment)}\n- تاريخ الحكم: ${date(c.judgmentDate)}\n- النتيجة: ${val(c.caseResult)}\n\n## المهام والإجراءات\n${(c.tasks||[]).map((t:any)=>`- ${val(t.title)} — ${val(t.status)} — الأجل: ${date(t.legalDeadline||t.dueDate)} — ${val(t.notes)}`).join('\n')||'لا توجد مهام مرتبطة'}\n\n## البيانات المالية\n- الأتعاب: ${val(c.totalFees)}\n- المدفوع: ${val(c.paidAmount)}\n\n## ملاحظات القضية\n${val(c.notes)}\n`;
}
