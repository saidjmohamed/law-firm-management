'use client';

import React from 'react';
import { useSettings, getSettingValue } from '@/lib/api';
import { WILAYAS, formatDate } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';

interface Case {
  id?: number;
  caseNumber?: string;
  subject?: string;
  client?: { id: number; name?: string } | null;
  caseNature?: string;
  litigationStage?: string;
  origCaseNumber?: string;
  customStage?: string;
  status?: string;
  clientId?: number;
  wilayaId?: number;
  judiciaryType?: string;
  courtLevel?: string;
  courtId?: number;
  chamber?: string;
  chamberNumber?: number;
  councilName?: string;
  courtName?: string;
  totalFees?: number;
  paidAmount?: number;
  registrationDate?: string;
  firstSessionDate?: string;
  delibDate?: string;
  barPhone?: string;
  lawyer?: string;
  notes?: string;
  judgment?: string;
  caseResult?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Party {
  id?: number;
  caseId: number;
  role?: string;
  side?: string;
  name?: string;
  phone?: string;
  lawyerName?: string;
  lawyerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Delay {
  id?: number;
  caseId: number;
  delayDate?: string;
  reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id?: number;
  caseId?: number;
  caseNumber?: string;
  date?: string;
  time?: string;
  court?: string;
  chamber?: string;
  roomNumber?: string;
  notes?: string;
  status?: string;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CasePrintProps {
  caseData: Case;
  parties: Party[];
  delays: Delay[];
  sessions: Session[];
  courtPhones?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '—').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char);
}

export function CasePrintButton({ caseData, parties, delays, sessions, courtPhones }: CasePrintProps) {
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
      const remainingFees = Math.max(0, (caseData.totalFees || 0) - (caseData.paidAmount || 0));

      // تقسيم الأطراف حسب حقل side (for = في حقه، against = ضده)
      // إذا كان side فارغ/null، نعتبره 'for' (في حقه) كقيمة افتراضية
      const inFavorParties = parties.filter(p => p.side === 'for');
      const againstParties = parties.filter(p => p.side === 'against');
      const otherParties = parties.filter(p => !p.side || (p.side !== 'for' && p.side !== 'against'));

      // بناء صفوف الأطراف — Monochrome
      function buildPartyRows(partyList: Party[]) {
        if (partyList.length === 0) return '';
        return partyList.map(p => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;font-weight:600;">${escapeHtml(p.name || '—')}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${escapeHtml(p.role || '—')}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${escapeHtml(p.phone || '—')}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${escapeHtml(p.lawyerName || '—')}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${escapeHtml(p.lawyerPhone || '—')}</td>
          </tr>
        `).join('');
      }

      const inFavorRows = buildPartyRows(inFavorParties);
      const againstRows = buildPartyRows(againstParties);
      const otherRows = buildPartyRows(otherParties);

      // بناء التأجيلات
      function buildDelayRows() {
        if (orderedDelays.length === 0) return '<tr><td colspan="3" style="padding:8px;text-align:center;color:#666;font-size:11px;">لا توجد تأجيلات</td></tr>';
        return orderedDelays.map((d, i) => `
          <tr>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:40px;">${i + 1}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:120px;">${formatDate(d.delayDate)}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;">${escapeHtml(d.reason || '—')}</td>
          </tr>
        `).join('');
      }

      // بناء الجلسات
      function buildSessionRows() {
        if (orderedSessions.length === 0) return '<tr><td colspan="4" style="padding:8px;text-align:center;color:#666;font-size:11px;">لا توجد جلسات</td></tr>';
        return orderedSessions.map((s, i) => `
          <tr>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:40px;">${i + 1}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:120px;">${formatDate(s.date)}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;">${escapeHtml(s.court || s.chamber || '—')}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;">${escapeHtml(s.notes || s.result || '—')}</td>
          </tr>
        `).join('');
      }

      const orderedSessions = [...sessions].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      const orderedDelays = [...delays].sort((a, b) => new Date(a.delayDate || 0).getTime() - new Date(b.delayDate || 0).getTime());

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>بطاقة المجلد الورقي - ${escapeHtml(caseData.caseNumber || '')}</title>
<style>
@page{size:A4;margin:12mm 10mm}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;color:#000;font-size:12px;line-height:1.6}
header{text-align:center;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:12px}
header h1{font-size:18px;font-weight:900}header h2{font-size:13px}
header p{font-size:10px}.title{text-align:center;font-size:16px;font-weight:900;border:2px solid #000;padding:7px;margin-bottom:10px}
.section{font-weight:900;background:#000;color:#fff;padding:5px 9px;margin:12px 0 5px;display:inline-block}
table{width:100%;border-collapse:collapse;margin-bottom:7px;page-break-inside:avoid}
th{background:#e5e5e5;border:1px solid #333;padding:5px;font-size:10px}
td{border:1px solid #333;padding:5px 7px;font-size:11px;vertical-align:middle}
td:first-child{font-weight:800;background:#f0f0f0}
.party-heading{font-weight:900;margin:6px 0 3px}
.footer{border-top:1px solid #000;margin-top:16px;padding-top:6px;display:flex;justify-content:space-between;font-size:9px}
@media print{body{margin:0}}
</style>
</head>
<body>
<header><h1>${escapeHtml(lawyerName)}</h1><h2>${escapeHtml(lawyerTitle)}</h2>
<p>${escapeHtml(lawyerAddress)} ${escapeHtml(lawyerPhone)} ${escapeHtml(lawyerEmail)}</p></header>
<div class="title">بطاقة تعريف المجلد الورقي — القضية رقم: ${escapeHtml(caseData.caseNumber || '—')}</div>

<div class="section">أولاً: أطراف القضية ومحاموهم</div>
${[['في حقه',inFavorRows],['ضده',againstRows],['أطراف أخرى',otherRows]].map(([label,rows])=>rows?`<div class="party-heading">${label}</div><table><thead><tr><th>الاسم واللقب</th><th>الصفة الإجرائية</th><th>الهاتف</th><th>المحامي</th><th>هاتف المحامي</th></tr></thead><tbody>${rows}</tbody></table>`:'').join('')}
${parties.length===0?'<p>لا توجد أطراف مسجلة</p>':''}

<div class="section">ثانياً: بيانات القضية</div>
<table>
<tr><td>رقم الملف الداخلي</td><td>${escapeHtml(caseData.id || '—')}</td><td>رقم القضية</td><td>${escapeHtml(caseData.caseNumber || '—')}</td></tr>
<tr><td>رقم القضية الأصلية</td><td>${escapeHtml(caseData.origCaseNumber || '—')}</td><td>الموضوع</td><td>${escapeHtml(caseData.subject || '—')}</td></tr>
<tr><td>طبيعة القضية</td><td>${escapeHtml(caseData.caseNature || '—')}</td><td>مرحلة التقاضي</td><td>${escapeHtml(caseData.litigationStage || '—')}</td></tr>
<tr><td>الحالة الإجرائية</td><td>${escapeHtml(caseData.status || '—')}</td><td>تاريخ التسجيل</td><td>${formatDate(caseData.registrationDate)}</td></tr>
<tr><td>أول جلسة</td><td>${formatDate(caseData.firstSessionDate)}</td><td>تاريخ المداولة</td><td>${formatDate(caseData.delibDate)}</td></tr>
</table>

<div class="section">ثالثاً: الجهة القضائية</div>
<table>
<tr><td>نوع القضاء</td><td>${escapeHtml(caseData.judiciaryType || '—')}</td><td>درجة التقاضي</td><td>${escapeHtml(caseData.courtLevel || '—')}</td></tr>
<tr><td>الولاية</td><td>${escapeHtml(wilayaName || '—')}</td><td>المجلس</td><td>${escapeHtml(caseData.councilName || '—')}</td></tr>
<tr><td>المحكمة</td><td>${escapeHtml(caseData.courtName || '—')}</td><td>الغرفة / القسم</td><td>${escapeHtml(caseData.chamber || '—')}</td></tr>
${caseData.chamberNumber? `<tr><td>رقم الغرفة</td><td>${escapeHtml(caseData.chamberNumber)}</td><td></td><td></td></tr>`:''}
${caseData.barPhone?`<tr><td>هاتف قاعة المحامين</td><td colspan="3">${escapeHtml(caseData.barPhone)}</td></tr>`:''}
</table>

<div class="section">رابعاً: الجلسات والتأجيلات</div>
<div class="party-heading">الجلسات</div>
<table><thead><tr><th>#</th><th>التاريخ</th><th>المحكمة / الغرفة</th><th>الملاحظات</th></tr></thead><tbody>${buildSessionRows()}</tbody></table>
<div class="party-heading">التأجيلات</div>
<table><thead><tr><th>#</th><th>التاريخ</th><th>سبب التأجيل</th></tr></thead><tbody>${buildDelayRows()}</tbody></table>

<div class="section">خامساً: الأتعاب والوضع المالي</div>
<table><tr><td>إجمالي الأتعاب</td><td>${(caseData.totalFees || 0).toLocaleString('fr-DZ')} دج</td><td>المبلغ المدفوع</td><td>${(caseData.paidAmount || 0).toLocaleString('fr-DZ')} دج</td></tr>
<tr><td>المبلغ المتبقي</td><td colspan="3">${remainingFees.toLocaleString('fr-DZ')} دج</td></tr></table>
${caseData.notes?`<div class="section">ملاحظات</div><p style="border:1px solid #000;padding:8px;white-space:pre-wrap">${escapeHtml(caseData.notes)}</p>`:''}
<div class="footer"><span>مكتب الأستاذ ${escapeHtml(lawyerName)} — ${escapeHtml(lawyerTitle)}</span><span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-DZ')}</span></div>
</body></html>`

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        toast.success('تم فتح ملف القضية للطباعة');
      } else {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ملف-القضية-${caseData.caseNumber || 'case'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('تم تحميل ملف القضية');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('حدث خطأ أثناء إنشاء ملف القضية');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateAndPrint}
      disabled={loading}
      className="touch-target"
    >
      <Printer className="w-3 h-3 ml-1" />
      {loading ? 'جاري التحميل...' : 'طباعة'}
    </Button>
  );
}
