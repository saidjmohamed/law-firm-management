'use client';

import React from 'react';
import { useSettings, getSettingValue } from '@/lib/api';
import { WILAYAS, ARABIC_DAYS, ARABIC_MONTHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';

interface Case {
  id?: number; caseNumber?: string; subject?: string; caseNature?: string;
  litigationStage?: string; origCaseNumber?: string; customStage?: string;
  status?: string; wilayaId?: number; judiciaryType?: string; courtLevel?: string;
  courtId?: number; chamber?: string; chamberNumber?: number; councilName?: string;
  courtName?: string; totalFees?: number; paidAmount?: number; registrationDate?: string;
  firstSessionDate?: string; delibDate?: string; barPhone?: string; lawyer?: string;
  notes?: string; judgment?: string; createdAt: Date; updatedAt: Date;
}
interface Party {
  id?: number; caseId: number; role?: string; side?: string; name?: string;
  phone?: string; lawyerName?: string; lawyerPhone?: string; createdAt: Date; updatedAt: Date;
}
interface CaseAnnouncementProps { caseData: Case; parties: Party[]; }

function escapeHtml(value: unknown): string {
  return String(value ?? '—').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char);
}
function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return '___/___/________';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${ARABIC_DAYS[d.getDay()]} ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function CaseAnnouncementButton({ caseData, parties }: CaseAnnouncementProps) {
  const [loading, setLoading] = React.useState(false);
  const { settings } = useSettings();

  async function generateAnnouncement() {
    setLoading(true);
    try {
      const lawyerName = await getSettingValue(settings, 'lawyerName') || 'سايج محمد';
      const lawyerTitle = await getSettingValue(settings, 'lawyerTitle') || 'محام لدى المجلس';
      const lawyerAddress = await getSettingValue(settings, 'lawyerAddress') || '';
      const lawyerPhone = await getSettingValue(settings, 'lawyerPhone') || '';
      const lawyerEmail = await getSettingValue(settings, 'lawyerEmail') || '';
      const wilayaName = WILAYAS.find(w => w.code === caseData.wilayaId)?.name || '';
      const represented = parties.filter(p => p.side === 'for');
      const opposing = parties.filter(p => p.side === 'against');
      const others = parties.filter(p => !p.side || (p.side !== 'for' && p.side !== 'against'));
      const partyNames = (items: Party[]) => items.length
        ? items.map(p => escapeHtml(p.name || '—') + (p.role ? '، بصفته ' + escapeHtml(p.role) : '')).join('، ')
        : '........................................................';
      const court = [caseData.councilName, caseData.courtName].filter(Boolean).join(' — ') || '................................';
      const chamber = [caseData.chamber, caseData.chamberNumber ? 'رقم '+caseData.chamberNumber : ''].filter(Boolean).join(' — ');
      const today = formatArabicDate(new Date().toISOString());
      const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>إعلان تأسيس الدعوى — ${escapeHtml(caseData.caseNumber)}</title>
<style>
@page{size:A4 portrait;margin:12mm}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{font-family:Tahoma,"Arial",sans-serif;color:#111;background:#fff;font-size:12px;line-height:1.65}
.sheet{height:273mm;max-height:273mm;overflow:hidden;border:1.5px solid #111;padding:8mm;display:flex;flex-direction:column;gap:10px}
.letterhead{text-align:center;border-bottom:3px double #111;padding-bottom:8px}
.letterhead h1{font-size:19px;margin:0 0 2px;font-weight:800}.letterhead h2{font-size:12px;margin:0 0 3px;font-weight:600}
.contact{font-size:9.5px;color:#333}
.title{border:2px solid #111;text-align:center;padding:7px;font-size:17px;font-weight:900}
.intro{font-size:12px;text-align:justify;margin:0}
.card{border:1px solid #222;padding:8px}
.card-title{font-weight:900;background:#eee;border-bottom:1px solid #333;margin:-8px -8px 7px;padding:4px 7px;font-size:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 12px}
.field{display:flex;gap:5px;padding:2px 0;border-bottom:1px dotted #aaa}.label{font-weight:800;white-space:nowrap}.value{overflow-wrap:anywhere}
.party{margin:4px 0}.party strong{display:inline-block;min-width:145px}
.request{text-align:justify;margin:0;padding:8px;border:1px solid #222}
.date{font-weight:800;text-align:left}
.signatures{display:flex;justify-content:space-between;gap:20px;margin-top:auto;padding-top:8px}
.signature{width:42%;text-align:center;font-weight:700}.line{height:23mm;border-bottom:1px solid #222;margin-bottom:5px}
.footer{border-top:1px solid #222;padding-top:5px;text-align:center;font-size:9px;color:#333}
@media print{html,body{width:210mm;height:297mm}.sheet{break-inside:avoid;page-break-inside:avoid}}
</style></head><body><main class="sheet">
<header class="letterhead"><h1>${escapeHtml(lawyerName)}</h1><h2>${escapeHtml(lawyerTitle)}</h2>
<div class="contact">${[lawyerAddress,lawyerPhone?'الهاتف: '+lawyerPhone:'',lawyerEmail].filter(Boolean).map(escapeHtml).join(' | ')}</div></header>
<div class="title">إعلان تأسيس في الدعوى</div>
<p class="intro">السيد الرئيس وأعضاء المحكمة الموقرون، يشرفني أنا الأستاذ <b>${escapeHtml(lawyerName)}</b>، ${escapeHtml(lawyerTitle)}، أن أعلم هيئتكم الموقرة بتأسيسي نائباً عن الطرف/الأطراف المحددين أدناه في القضية المبينة بياناتها:</p>
<section class="card"><div class="card-title">بطاقة تعريف القضية</div><div class="grid">
<div class="field"><span class="label">رقم القضية:</span><span class="value"><b>${escapeHtml(caseData.caseNumber || '................')}</b></span></div>
<div class="field"><span class="label">رقم القضية الأصلية:</span><span class="value">${escapeHtml(caseData.origCaseNumber)}</span></div>
<div class="field"><span class="label">الموضوع:</span><span class="value">${escapeHtml(caseData.subject)}</span></div>
<div class="field"><span class="label">طبيعة الدعوى:</span><span class="value">${escapeHtml(caseData.caseNature)}</span></div>
<div class="field"><span class="label">مرحلة التقاضي:</span><span class="value">${escapeHtml(caseData.litigationStage || caseData.customStage)}</span></div>
<div class="field"><span class="label">الجهة القضائية:</span><span class="value">${escapeHtml(court)}</span></div>
<div class="field"><span class="label">الولاية:</span><span class="value">${escapeHtml(wilayaName)}</span></div>
<div class="field"><span class="label">الغرفة / القسم:</span><span class="value">${escapeHtml(chamber)}</span></div>
<div class="field"><span class="label">تاريخ التسجيل:</span><span class="value">${escapeHtml(formatArabicDate(caseData.registrationDate))}</span></div>
<div class="field"><span class="label">أول جلسة:</span><span class="value">${escapeHtml(formatArabicDate(caseData.firstSessionDate))}</span></div>
</div></section>
<section class="card"><div class="card-title">أطراف الخصومة</div>
<div class="party"><strong>الطرف/الأطراف الذين أمثلهم:</strong> ${partyNames(represented)}</div>
<div class="party"><strong>الخصوم:</strong> ${partyNames(opposing)}</div>
${others.length ? `<div class="party"><strong>أطراف أخرى:</strong> ${partyNames(others)}</div>` : ''}
</section>
<p class="request">ألتمس من هيئتكم الموقرة تسجيل تأسيسي وإثبات نيابتي عن الطرف/الأطراف المذكورين أعلاه، واعتماد نيابتي في إجراءات الخصومة والتبليغ وفقاً للقانون، مع حفظ حقوقهم ودفوعهم.</p>
<div class="date">حرر بتاريخ: ${escapeHtml(today)}</div>
<div class="signatures"><div class="signature"><div class="line"></div>توقيع المحامي<br>الأستاذ ${escapeHtml(lawyerName)}</div><div class="signature"><div class="line"></div>ختم المحامي</div></div>
<footer class="footer">مكتب الأستاذ ${escapeHtml(lawyerName)} — ${escapeHtml(lawyerTitle)} — ${escapeHtml(lawyerAddress)}</footer>
</main></body></html>`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html); printWindow.document.close();
        printWindow.onload = () => printWindow.print();
        setTimeout(() => { if (!printWindow.closed) printWindow.print(); }, 700);
        toast.success('تم تجهيز إعلان التأسيس للطباعة');
      } else {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `إعلان-تأسيس-${caseData.caseNumber || 'case'}.html`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        toast.success('تم تحميل إعلان التأسيس');
      }
    } catch (error) {
      console.error('Announcement error:', error); toast.error('حدث خطأ أثناء إنشاء الإعلان');
    } finally { setLoading(false); }
  }

  return <Button variant="outline" size="sm" onClick={generateAnnouncement} disabled={loading} className="touch-target">
    <Scale className="w-3 h-3 ml-1" />{loading ? 'جاري التحميل...' : 'إعلان تأسيس'}
  </Button>;
}
