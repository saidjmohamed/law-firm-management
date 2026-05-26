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

      // تقسيم الأطراف حسب حقل side (for = في حقه، against = ضده)
      // إذا كان side فارغ/null، نعتبره 'for' (في حقه) كقيمة افتراضية
      const inFavorParties = parties.filter(p => !p.side || p.side === 'for');
      const againstParties = parties.filter(p => p.side === 'against');
      const otherParties = parties.filter(p => p.side && p.side !== 'for' && p.side !== 'against');

      // بناء صفوف الأطراف — Monochrome
      function buildPartyRows(partyList: Party[]) {
        if (partyList.length === 0) return '';
        return partyList.map(p => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;font-weight:600;">${p.name || '—'}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${p.role || '—'}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${p.phone || '—'}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${p.lawyerName || '—'}</td>
            <td style="padding:6px 10px;border:1px solid #333;font-size:11px;text-align:center;">${p.lawyerPhone || '—'}</td>
          </tr>
        `).join('');
      }

      const inFavorRows = buildPartyRows(inFavorParties);
      const againstRows = buildPartyRows(againstParties);
      const otherRows = buildPartyRows(otherParties);

      // بناء التأجيلات
      function buildDelayRows() {
        if (delays.length === 0) return '<tr><td colspan="3" style="padding:8px;text-align:center;color:#666;font-size:11px;">لا توجد تأجيلات</td></tr>';
        return delays.map((d, i) => `
          <tr>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:40px;">${i + 1}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:120px;">${formatDate(d.delayDate)}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;">${d.reason || '—'}</td>
          </tr>
        `).join('');
      }

      // بناء الجلسات
      function buildSessionRows() {
        if (sessions.length === 0) return '<tr><td colspan="4" style="padding:8px;text-align:center;color:#666;font-size:11px;">لا توجد جلسات</td></tr>';
        return sessions.map((s, i) => `
          <tr>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:40px;">${i + 1}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;width:120px;">${formatDate(s.date)}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;text-align:center;">${s.court || s.chamber || '—'}</td>
            <td style="padding:5px 10px;border:1px solid #333;font-size:11px;">${s.notes || s.result || '—'}</td>
          </tr>
        `).join('');
      }

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>ملف القضية - ${caseData.caseNumber || ''}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 10mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif;
      direction: rtl;
      color: #000;
      font-size: 12px;
      line-height: 1.6;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* الديباجة */
    .letterhead {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 3px double #000;
    }
    .letterhead h1 {
      font-size: 18px;
      font-weight: 900;
      color: #000;
      margin-bottom: 2px;
    }
    .letterhead h2 {
      font-size: 13px;
      font-weight: 700;
      color: #000;
      margin-bottom: 4px;
    }
    .letterhead .contact {
      font-size: 10px;
      color: #333;
      line-height: 1.7;
    }
    .letterhead .contact span {
      display: inline-block;
      margin: 0 6px;
    }

    /* عنوان القضية */
    .case-title {
      text-align: center;
      font-size: 15px;
      font-weight: 900;
      color: #000;
      margin-bottom: 14px;
      padding: 8px 0;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }

    /* عناوين الأقسام */
    .section-title {
      font-size: 12px;
      font-weight: 900;
      color: #fff;
      background: #000;
      padding: 5px 12px;
      margin-bottom: 6px;
      margin-top: 14px;
      border-radius: 3px;
      display: inline-block;
    }

    /* جداول المعلومات */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    th {
      background: #000;
      color: #fff;
      font-weight: 900;
      padding: 6px 10px;
      text-align: center;
      font-size: 10px;
    }
    .info-table td {
      border: 1px solid #333;
      padding: 5px 10px;
      font-size: 11px;
      vertical-align: middle;
    }
    .info-table td:first-child {
      font-weight: 800;
      color: #000;
      width: 24%;
      background: #e5e5e5;
      font-size: 10px;
    }
    .info-table td:nth-child(2) {
      width: 26%;
    }
    .info-table td:nth-child(3) {
      font-weight: 800;
      color: #000;
      width: 24%;
      background: #e5e5e5;
      font-size: 10px;
    }

    /* تسمية الأطراف */
    .party-label {
      font-size: 11px;
      font-weight: 900;
      padding: 3px 10px;
      margin-top: 8px;
      margin-bottom: 2px;
      display: inline-block;
      border-radius: 3px 3px 0 0;
      color: #fff;
    }
    .party-favor { background: #333; }
    .party-against { background: #000; }
    .party-other { background: #666; }

    /* منطوق الحكم */
    .judgment-box {
      border: 2px solid #000;
      border-radius: 4px;
      padding: 10px;
      margin-top: 6px;
      min-height: 40px;
      white-space: pre-wrap;
      line-height: 1.8;
      font-size: 11px;
      font-weight: 600;
      background: #f5f5f5;
    }

    /* تذييل */
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #000;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #333;
      font-weight: 600;
    }

    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>

  <!-- الديباجة -->
  <div class="letterhead">
    <h1>${lawyerName}</h1>
    <h2>${lawyerTitle}</h2>
    <div class="contact">
      ${lawyerAddress ? `<span>${lawyerAddress}</span>` : ''}
      ${lawyerPhone ? `<span>الهاتف: ${lawyerPhone}</span>` : ''}
      ${lawyerEmail ? `<span>${lawyerEmail}</span>` : ''}
    </div>
  </div>

  <!-- عنوان القضية -->
  <div class="case-title">ملف القضية رقم: ${caseData.caseNumber || '—'}</div>

  <!-- معالم القضية -->
  <div class="section-title">معالم القضية</div>
  <table class="info-table">
    <tr>
      <td>رقم القضية</td>
      <td>${caseData.caseNumber || '—'}</td>
      <td>الموضوع</td>
      <td>${caseData.subject || '—'}</td>
    </tr>
    <tr>
      <td>طبيعة القضية</td>
      <td>${caseData.caseNature || '—'}</td>
      <td>مرحلة التقاضي</td>
      <td>${caseData.litigationStage || '—'}</td>
    </tr>
    <tr>
      <td>المجلس</td>
      <td>${caseData.councilName || '—'}</td>
      <td>المحكمة</td>
      <td>${caseData.courtName || '—'}</td>
    </tr>
    <tr>
      <td>الغرفة / القسم</td>
      <td>${caseData.chamber || '—'}</td>
      <td>الولاية</td>
      <td>${wilayaName || '—'}</td>
    </tr>
    ${(() => { try { const ph = courtPhones ? JSON.parse(courtPhones) : []; return Array.isArray(ph) && ph.length > 0 ? `<tr><td>هاتف المحكمة</td><td>${ph.join(' / ')}</td><td></td><td></td></tr>` : ''; } catch { return ''; } })()}
    <tr>
      <td>تاريخ التسجيل</td>
      <td>${formatDate(caseData.registrationDate)}</td>
      <td>أول جلسة</td>
      <td>${formatDate(caseData.firstSessionDate)}</td>
    </tr>
    <tr>
      <td>رقم القضية الأصلية</td>
      <td>${caseData.origCaseNumber || '—'}</td>
      <td>تاريخ المداولة</td>
      <td>${formatDate(caseData.delibDate)}</td>
    </tr>
    ${caseData.barPhone ? `<tr><td>هاتف قاعة المحامين</td><td>${caseData.barPhone}</td><td></td><td></td></tr>` : ''}
    ${caseData.caseResult === 'won' ? `<tr><td>نتيجة القضية</td><td style="color:#059669;font-weight:bold">✓ ربحت القضية</td><td></td><td></td></tr>` : ''}
    ${caseData.caseResult === 'lost' ? `<tr><td>نتيجة القضية</td><td style="color:#dc2626;font-weight:bold">✗ خسرت القضية</td><td></td><td></td></tr>` : ''}
  </table>

  <!-- أطراف النزاع -->
  <div class="section-title">أطراف النزاع</div>

  ${inFavorParties.length > 0 ? `
  <div class="party-label party-favor">في حقه</div>
  <table>
    <thead>
      <tr>
        <th>الاسم واللقب</th>
        <th>المركز القانوني</th>
        <th>الهاتف</th>
        <th>محاميه</th>
        <th>هاتف المحامي</th>
      </tr>
    </thead>
    <tbody>${inFavorRows}</tbody>
  </table>` : ''}

  ${againstParties.length > 0 ? `
  <div class="party-label party-against">ضده</div>
  <table>
    <thead>
      <tr>
        <th>الاسم واللقب</th>
        <th>المركز القانوني</th>
        <th>الهاتف</th>
        <th>محاميه</th>
        <th>هاتف المحامي</th>
      </tr>
    </thead>
    <tbody>${againstRows}</tbody>
  </table>` : ''}

  ${otherParties.length > 0 ? `
  <div class="party-label party-other">أطراف أخرى</div>
  <table>
    <thead>
      <tr>
        <th>الاسم واللقب</th>
        <th>المركز القانوني</th>
        <th>الهاتف</th>
        <th>محاميه</th>
        <th>هاتف المحامي</th>
      </tr>
    </thead>
    <tbody>${otherRows}</tbody>
  </table>` : ''}

  ${parties.length === 0 ? '<p style="color:#666;font-size:11px;padding:4px 0;">لا توجد أطراف مسجلة</p>' : ''}

  <!-- تأجيلات الجلسات -->
  <div class="section-title">تأجيلات الجلسات</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>التاريخ</th>
        <th>السبب</th>
      </tr>
    </thead>
    <tbody>${buildDelayRows()}</tbody>
  </table>

  <!-- الجلسات -->
  ${sessions.length > 0 ? `
  <div class="section-title">الجلسات</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>التاريخ</th>
        <th>المحكمة / الغرفة</th>
        <th>الملاحظات</th>
      </tr>
    </thead>
    <tbody>${buildSessionRows()}</tbody>
  </table>` : ''}

  <!-- منطوق الحكم -->
  ${caseData.judgment ? `
  <div class="section-title">منطوق الحكم / القرار</div>
  <div class="judgment-box">${caseData.judgment}</div>` : ''}

  <!-- ملاحظات -->
  ${caseData.notes ? `
  <div class="section-title">ملاحظات</div>
  <div style="border:2px solid #000;border-radius:4px;padding:8px;margin-top:6px;font-size:11px;white-space:pre-wrap;line-height:1.8;font-weight:600;background:#f5f5f5;">${caseData.notes}</div>` : ''}

  <!-- تذييل -->
  <div class="footer">
    <span>مكتب الاستاذ ${lawyerName} - ${lawyerTitle}</span>
    <span>طبع بتاريخ: ${new Date().toLocaleDateString('ar-DZ')}</span>
  </div>

</body>
</html>`;

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
