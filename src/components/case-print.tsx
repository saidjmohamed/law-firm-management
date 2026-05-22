'use client';

import React from 'react';
import { db, getSetting, type Case, type Party, type Delay, type Session } from '@/lib/db';
import { WILAYAS, formatDate } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface CasePrintProps {
  caseData: Case;
  parties: Party[];
  delays: Delay[];
  sessions: Session[];
}

export function CasePrintButton({ caseData, parties, delays, sessions }: CasePrintProps) {
  const [loading, setLoading] = React.useState(false);

  async function generateAndPrint() {
    setLoading(true);
    try {
      // Fetch lawyer settings
      const lawyerName = await getSetting<string>('lawyerName') || 'سايج محمد';
      const lawyerTitle = await getSetting<string>('lawyerTitle') || 'محام لدى المجلس';
      const lawyerAddress = await getSetting<string>('lawyerAddress') || '';
      const lawyerPhone = await getSetting<string>('lawyerPhone') || '';
      const lawyerEmail = await getSetting<string>('lawyerEmail') || '';

      const wilayaName = WILAYAS.find(w => w.code === caseData.wilayaId)?.name || '';

      // Build parties - split into في حق and ضد
      const inFavorParties = parties.filter(p =>
        p.role === 'مدعي' || p.role === 'مستأنف' || p.role === 'طالب' || p.role === 'مقدم الشكوى'
      );
      const againstParties = parties.filter(p =>
        p.role === 'مدعى عليه' || p.role === 'مستأنف ضده' || p.role === 'مطلوب' || p.role === 'متهم' || p.role === 'مشكو في حقه'
      );
      const otherParties = parties.filter(p =>
        !inFavorParties.includes(p) && !againstParties.includes(p)
      );

      // Build في حق rows
      let inFavorRows = '';
      for (const p of inFavorParties.length > 0 ? inFavorParties : [null as any]) {
        inFavorRows += `
          <tr>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;background:#f0f7f4;">${p?.name || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.role || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.phone || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.lawyerName || ''}</td>
          </tr>`;
      }

      // Build ضد rows
      let againstRows = '';
      for (const p of againstParties.length > 0 ? againstParties : [null as any]) {
        againstRows += `
          <tr>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;background:#fdf2f2;">${p?.name || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.role || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.phone || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.lawyerName || ''}</td>
          </tr>`;
      }

      // Other parties rows
      let otherRows = '';
      for (const p of otherParties) {
        otherRows += `
          <tr>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.name || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.role || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.phone || ''}</td>
            <td style="border:1px solid #555;padding:4px 6px;text-align:center;font-size:11px;">${p?.lawyerName || ''}</td>
          </tr>`;
      }

      // Build delays - 4 rows in 2x2 layout
      const delayEntries = delays.slice(0, 4);
      while (delayEntries.length < 4) {
        delayEntries.push({ delayDate: '', reason: '' } as any);
      }
      const delayRow1 = delayEntries.slice(0, 2);
      const delayRow2 = delayEntries.slice(2, 4);

      let delaysTable = `
        <table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:11px;">
          <tr>
            <th style="border:1px solid #555;padding:4px;background:#1a5276;color:#fff;font-size:10px;" colspan="4">تأجيلات الجلسات</th>
          </tr>
          <tr>
            <th style="border:1px solid #555;padding:3px;background:#2980b9;color:#fff;font-size:9px;width:25%;">التاريخ</th>
            <th style="border:1px solid #555;padding:3px;background:#2980b9;color:#fff;font-size:9px;width:25%;">السبب</th>
            <th style="border:1px solid #555;padding:3px;background:#2980b9;color:#fff;font-size:9px;width:25%;">التاريخ</th>
            <th style="border:1px solid #555;padding:3px;background:#2980b9;color:#fff;font-size:9px;width:25%;">السبب</th>
          </tr>
          <tr>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${formatDate(delayRow1[0]?.delayDate) || '___/___/202_'}</td>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${delayRow1[0]?.reason || ''}</td>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${formatDate(delayRow1[1]?.delayDate) || '___/___/202_'}</td>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${delayRow1[1]?.reason || ''}</td>
          </tr>
          <tr>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${formatDate(delayRow2[0]?.delayDate) || '___/___/202_'}</td>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${delayRow2[0]?.reason || ''}</td>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${formatDate(delayRow2[1]?.delayDate) || '___/___/202_'}</td>
            <td style="border:1px solid #555;padding:3px;text-align:center;font-size:10px;">${delayRow2[1]?.reason || ''}</td>
          </tr>
        </table>`;

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>ملف القضية - ${caseData.caseNumber || ''}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
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
      line-height: 1.5;
      background: #fff;
    }
    .page {
      width: 210mm;
      height: 297mm;
      padding: 10mm;
      margin: 0 auto;
      background: #fff;
      overflow: hidden;
    }

    /* الديباجة - في الوسط بخط جميل */
    .letterhead {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1a5276;
    }
    .letterhead h1 {
      font-size: 16px;
      font-weight: bold;
      color: #1a5276;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }
    .letterhead h2 {
      font-size: 12px;
      font-weight: normal;
      color: #2c3e50;
      margin-bottom: 4px;
    }
    .letterhead .contact {
      font-size: 10px;
      color: #555;
      line-height: 1.6;
    }
    .letterhead .contact span {
      display: inline-block;
      margin: 0 8px;
    }
    .letterhead .divider {
      width: 60%;
      margin: 6px auto 0;
      border-top: 1px solid #bdc3c7;
    }

    /* عنوان القضية */
    .case-title {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      color: #1a5276;
      margin-bottom: 8px;
      padding: 4px 0;
      border-bottom: 1px solid #ddd;
    }

    .section-title {
      font-size: 11px;
      font-weight: bold;
      color: #1a5276;
      border-bottom: 1px solid #2980b9;
      padding-bottom: 2px;
      margin-bottom: 5px;
      margin-top: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    th {
      background: #1a5276;
      color: #fff;
      font-weight: bold;
      padding: 4px 6px;
      text-align: center;
      font-size: 10px;
    }
    td {
      border: 1px solid #555;
      padding: 4px 6px;
      font-size: 11px;
    }
    .info-table td:first-child {
      font-weight: bold;
      color: #1a5276;
      width: 22%;
      background: #f0f4f8;
      font-size: 10px;
    }
    .info-table td:nth-child(2) {
      width: 28%;
    }
    .info-table td:nth-child(3) {
      font-weight: bold;
      color: #1a5276;
      width: 22%;
      background: #f0f4f8;
      font-size: 10px;
    }

    .party-header {
      font-size: 11px;
      font-weight: bold;
      padding: 3px 8px;
      margin-top: 4px;
      display: inline-block;
      border-radius: 3px 3px 0 0;
    }
    .party-favor {
      background: #27ae60;
      color: #fff;
    }
    .party-against {
      background: #c0392b;
      color: #fff;
    }

    .judgment-area {
      border: 1px solid #555;
      min-height: 50px;
      padding: 6px;
      margin-top: 4px;
      white-space: pre-wrap;
      line-height: 1.8;
      font-size: 11px;
    }

    @media print {
      body { margin: 0; }
      .page { margin: 0; padding: 10mm; }
    }
  </style>
</head>
<body>

<div class="page">
  <!-- الديباجة في الوسط -->
  <div class="letterhead">
    <h1>${lawyerName}</h1>
    <h2>${lawyerTitle}</h2>
    <div class="contact">
      ${lawyerAddress ? `<span>${lawyerAddress}</span>` : ''}
      ${lawyerPhone ? `<span>الهاتف: ${lawyerPhone}</span>` : ''}
      ${lawyerEmail ? `<span>${lawyerEmail}</span>` : ''}
    </div>
    <div class="divider"></div>
  </div>

  <!-- عنوان القضية -->
  <div class="case-title">ملف القضية رقم: ${caseData.caseNumber || '—'}</div>

  <!-- معالم القضية -->
  <div class="section-title">معالم القضية</div>
  <table class="info-table">
    <tr>
      <td>رقم القضية</td>
      <td>${caseData.caseNumber || ''}</td>
      <td>الموضوع</td>
      <td>${caseData.subject || ''}</td>
    </tr>
    <tr>
      <td>طبيعة القضية</td>
      <td>${caseData.caseNature || ''}</td>
      <td>مرحلة التقاضي</td>
      <td>${caseData.litigationStage || ''}</td>
    </tr>
    <tr>
      <td>المجلس/المحكمة</td>
      <td>${caseData.councilName || caseData.courtName || ''}</td>
      <td>الغرفة/القسم</td>
      <td>${caseData.chamber || ''}</td>
    </tr>
    <tr>
      <td>تاريخ التسجيل</td>
      <td>${formatDate(caseData.registrationDate) || ''}</td>
      <td>أول جلسة</td>
      <td>${formatDate(caseData.firstSessionDate) || ''}</td>
    </tr>
    <tr>
      <td>رقم القضية الأصلية</td>
      <td>${caseData.origCaseNumber || ''}</td>
      <td>تاريخ المداولة</td>
      <td>${formatDate(caseData.delibDate) || ''}</td>
    </tr>
    ${wilayaName ? `<tr><td>الولاية</td><td>${wilayaName}</td><td>هاتف قاعة المحامين</td><td>${caseData.barPhone || ''}</td></tr>` : ''}
  </table>

  <!-- أطراف النزاع - في حق و ضد -->
  <div class="section-title">أطراف النزاع</div>

  ${inFavorParties.length > 0 || inFavorRows ? `
  <div class="party-header party-favor">في حق</div>
  <table>
    <thead>
      <tr>
        <th>الاسم واللقب</th>
        <th>المركز القانوني</th>
        <th>الهاتف</th>
        <th>محاميه</th>
      </tr>
    </thead>
    <tbody>${inFavorRows}</tbody>
  </table>` : ''}

  ${againstParties.length > 0 || againstRows ? `
  <div class="party-header party-against">ضد</div>
  <table>
    <thead>
      <tr>
        <th>الاسم واللقب</th>
        <th>المركز القانوني</th>
        <th>الهاتف</th>
        <th>محاميه</th>
      </tr>
    </thead>
    <tbody>${againstRows}</tbody>
  </table>` : ''}

  ${otherParties.length > 0 ? `
  <div class="party-header" style="background:#7f8c8d;color:#fff;">أطراف أخرى</div>
  <table>
    <thead>
      <tr>
        <th>الاسم واللقب</th>
        <th>المركز القانوني</th>
        <th>الهاتف</th>
        <th>محاميه</th>
      </tr>
    </thead>
    <tbody>${otherRows}</tbody>
  </table>` : ''}

  <!-- تأجيلات الجلسات 2×2 -->
  ${delaysTable}

  <!-- منطوق الحكم -->
  <div class="section-title">منطوق الحكم/القرار</div>
  <div class="judgment-area">${caseData.judgment || ''}</div>
</div>

</body>
</html>`;

      // Open in new window for printing / saving as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        toast.success('تم فتح ملف القضية');
      } else {
        // Fallback: download as HTML file
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
      <FileText className="w-3 h-3 ml-1" />
      {loading ? 'جاري التحميل...' : 'إنشاء صفحة القضية'}
    </Button>
  );
}
