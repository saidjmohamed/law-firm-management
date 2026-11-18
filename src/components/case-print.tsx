'use client';

import React from 'react';
import { useSettings, getSettingValue } from '@/lib/api';
import { WILAYAS, formatDate } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';

interface Case {
  id?: number; caseNumber?: string; subject?: string; caseNature?: string;
  litigationStage?: string; origCaseNumber?: string; customStage?: string;
  status?: string; wilayaId?: number; judiciaryType?: string; courtLevel?: string;
  courtId?: number; chamber?: string; chamberNumber?: number; councilName?: string;
  courtName?: string; totalFees?: number; paidAmount?: number; registrationDate?: string;
  firstSessionDate?: string; delibDate?: string; barPhone?: string; lawyer?: string;
  notes?: string; judgment?: string; caseResult?: string;
  createdAt: Date; updatedAt: Date;
}
interface Party {
  id?: number; caseId: number; role?: string; side?: string; name?: string;
  phone?: string; lawyerName?: string; lawyerPhone?: string; createdAt: Date; updatedAt: Date;
}
interface Delay { id?: number; caseId: number; delayDate?: string; reason?: string; notes?: string; createdAt: Date; updatedAt: Date; }
interface Session { id?: number; caseId?: number; caseNumber?: string; date?: string; time?: string; court?: string; chamber?: string; roomNumber?: string; notes?: string; status?: string; result?: string; createdAt: Date; updatedAt: Date; }
interface CasePrintProps { caseData: Case; parties: Party[]; delays: Delay[]; sessions: Session[]; courtPhones?: string; }

function escapeHtml(value: unknown): string {
  return String(value ?? '—').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char);
}

export function CasePrintButton({ caseData, parties, delays, sessions }: CasePrintProps) {
  const [loading, setLoading] = React.useState(false);
  const { settings } = useSettings();

  async function generateAndPrint() {
    setLoading(true);
    try {
      const lawyerName = await getSettingValue(settings, 'lawyerName') || 'سايج محمد';
      const lawyerTitle = await getSettingValue(settings, 'lawyerTitle') || 'محام لدى المجلس';
      const lawyerAddress = await getSettingValue(settings, 'lawyerAddress') || '';
      const lawyerPhone = await getSettingValue(settings, 'lawyerPhone') || '';
      const lawyerEmail = await getSettingValue(settings, 'lawyerEmail') || '';
      const wilayaName = WILAYAS.find(w => w.code === caseData.wilayaId)?.name || '';
      const grouped = [
        { title: 'في حقه', items: parties.filter(p => p.side === 'for' || (!p.side && !parties.some(x => x.side === 'for'))) },
        { title: 'ضده', items: parties.filter(p => p.side === 'against') },
        { title: 'أطراف أخرى', items: parties.filter(p => p.side && p.side !== 'for' && p.side !== 'against') },
      ].filter(group => group.items.length);
      const partyHtml = grouped.length
        ? grouped.map(group => `<div class="party-line"><b>${escapeHtml(group.title)}:</b> ${group.items.map(p => escapeHtml(p.name || '—') + (p.role ? ' (' + escapeHtml(p.role) + ')' : '')).join('، ')}</div>`).join('')
        : '<div class="empty">لا توجد أطراف مسجلة</div>';
      const court = [caseData.councilName, caseData.courtName].filter(Boolean).join(' — ');
      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>بطاقة المجلد — ${escapeHtml(caseData.caseNumber)}</title>
<style>
@page{size:A4 portrait;margin:9mm}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{font-family:Tahoma,"Arial",sans-serif;color:#111;background:#fff;font-size:11.5px;line-height:1.5}
.sheet{min-height:270mm;border:1.5px solid #111;padding:7mm;display:flex;flex-direction:column;gap:8px}\n.section{break-inside:avoid;page-break-inside:avoid}\n.head,.main-title{break-inside:avoid;page-break-inside:avoid}
.head{text-align:center;border-bottom:3px double #111;padding:0 0 8px}
.head h1{font-size:19px;margin:0 0 2px;font-weight:800}.head h2{font-size:12px;margin:0 0 3px;font-weight:600}
.contact{font-size:9.5px;color:#333}.main-title{border:2px solid #111;text-align:center;padding:8px 10px;font-size:17px;font-weight:800;letter-spacing:.2px}
.case-number{font-size:22px;font-weight:900;display:block;margin-top:3px;direction:ltr}
.section{border:1px solid #222;padding:7px 9px}
.section-title{font-size:12px;font-weight:800;background:#eee;border-bottom:1px solid #333;padding:4px 7px;margin:-7px -9px 7px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 14px}
.field{display:flex;gap:5px;min-width:0;padding:2px 0;border-bottom:1px dotted #aaa}
.label{font-weight:800;white-space:nowrap}.value{font-weight:500;overflow-wrap:anywhere}
.party-line{padding:3px 0;border-bottom:1px dotted #aaa}.party-line:last-child{border:0}
.notes{white-space:pre-wrap;overflow-wrap:anywhere}
.footer{margin-top:auto;border-top:1px solid #222;padding-top:5px;display:flex;justify-content:space-between;gap:8px;font-size:9px}
@media print{html,body{width:auto;height:auto;min-height:0;margin:0;padding:0}.sheet{min-height:270mm;break-inside:auto;page-break-inside:auto}.section{break-inside:avoid;page-break-inside:avoid}}
</style></head><body><main class="sheet">
<header class="head"><h1>${escapeHtml(lawyerName)}</h1><h2>${escapeHtml(lawyerTitle)}</h2>
<div class="contact">${[lawyerAddress, lawyerPhone ? 'الهاتف: '+lawyerPhone : '', lawyerEmail].filter(Boolean).map(escapeHtml).join(' | ')}</div></header>
<div class="main-title">بطاقة تعريف المجلد الورقي <span class="case-number">رقم القضية: ${escapeHtml(caseData.caseNumber || 'غير محدد')}</span></div>
<section class="section"><div class="section-title">البيانات الأساسية للقضية</div><div class="grid">
<div class="field"><span class="label">رقم الملف الداخلي:</span><span class="value">${escapeHtml(caseData.id)}</span></div>
<div class="field"><span class="label">رقم القضية الأصلية:</span><span class="value">${escapeHtml(caseData.origCaseNumber)}</span></div>
<div class="field"><span class="label">الموضوع:</span><span class="value">${escapeHtml(caseData.subject)}</span></div>
<div class="field"><span class="label">طبيعة القضية:</span><span class="value">${escapeHtml(caseData.caseNature)}</span></div>
<div class="field"><span class="label">مرحلة التقاضي:</span><span class="value">${escapeHtml(caseData.litigationStage || caseData.customStage)}</span></div>
<div class="field"><span class="label">الحالة:</span><span class="value">${escapeHtml(caseData.status)}</span></div>
<div class="field"><span class="label">تاريخ التسجيل:</span><span class="value">${escapeHtml(formatDate(caseData.registrationDate))}</span></div>
<div class="field"><span class="label">أول جلسة:</span><span class="value">${escapeHtml(formatDate(caseData.firstSessionDate))}</span></div>\n<div class="field"><span class="label">تاريخ المداولة:</span><span class="value">${escapeHtml(formatDate(caseData.delibDate))}</span></div>\n<div class="field"><span class="label">تاريخ الحكم:</span><span class="value">${escapeHtml(formatDate(caseData.judgmentDate))}</span></div>\n<div class="field"><span class="label">نتيجة القضية:</span><span class="value">${escapeHtml(caseData.caseResult)}</span></div>\n<div class="field"><span class="label">المحامي المكلف:</span><span class="value">${escapeHtml(caseData.lawyer)}</span></div>
</div></section>
<section class="section"><div class="section-title">الجهة القضائية</div><div class="grid">
<div class="field"><span class="label">الولاية:</span><span class="value">${escapeHtml(wilayaName)}</span></div>
<div class="field"><span class="label">الجهة:</span><span class="value">${escapeHtml(court)}</span></div>
<div class="field"><span class="label">الغرفة / القسم:</span><span class="value">${escapeHtml(caseData.chamber)} ${caseData.chamberNumber ? ' — رقم '+escapeHtml(caseData.chamberNumber) : ''}</span></div>
<div class="field"><span class="label">هاتف قاعة المحامين:</span><span class="value">${escapeHtml(caseData.barPhone)}</span></div>
</div></section>
<section class="section"><div class="section-title">أطراف القضية</div>${partyHtml}</section>
${sessions.length ? `<section class="section"><div class="section-title">الجلسات المسجلة</div>${sessions.map((s, i) => `<div class="party-line"><b>الجلسة ${i + 1} — ${escapeHtml(formatDate(s.date))}${s.time ? '، ' + escapeHtml(s.time) : ''}</b><br>${[s.court, s.chamber, s.roomNumber ? 'القاعة ' + s.roomNumber : '', s.status, s.result, s.notes].filter(Boolean).map(escapeHtml).join(' — ')}</div>`).join('')}</section>` : ''}\n${delays.length ? `<section class="section"><div class="section-title">التأجيلات</div>${delays.map((d, i) => `<div class="party-line"><b>التأجيل ${i + 1} — ${escapeHtml(formatDate(d.delayDate))}</b><br>${[d.reason, d.notes].filter(Boolean).map(escapeHtml).join(' — ') || '—'}</div>`).join('')}</section>` : ''}\n${caseData.notes ? `<section class="section"><div class="section-title">ملاحظات مختصرة</div><div class="notes">${escapeHtml(caseData.notes)}</div></section>` : ''}
<footer class="footer"><span>مكتب الأستاذ ${escapeHtml(lawyerName)} — ${escapeHtml(lawyerTitle)}</span><span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-DZ')}</span></footer>
</main></body></html>`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
        printWindow.document.write(html); printWindow.document.close();
        toast.success('تم تجهيز بطاقة القضية للطباعة');
      } else {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `بطاقة-القضية-${caseData.caseNumber || 'case'}.html`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        toast.success('تم تحميل بطاقة القضية');
      }
    } catch (error) {
      console.error('Print error:', error); toast.error('حدث خطأ أثناء إنشاء بطاقة القضية');
    } finally { setLoading(false); }
  }

  return <Button variant="outline" size="sm" onClick={generateAndPrint} disabled={loading} className="touch-target">
    <Printer className="w-3 h-3 ml-1" />{loading ? 'جاري التحميل...' : 'طباعة'}
  </Button>;
}
