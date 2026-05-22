'use client';

import React from 'react';
import { db, getSetting, type Case, type Party, type Delay, type Session } from '@/lib/db';
import { WILAYAS, formatDate } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
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
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Build parties rows
      const partyRows = parties.length > 0 ? parties : [{ role: '', name: '', phone: '', lawyerName: '', lawyerPhone: '' } as Party];

      let partyTableRows = '';
      for (const p of partyRows) {
        partyTableRows += `
          <tr>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">${p.role || ''}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">${p.name || ''}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">${p.phone || ''}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">${p.lawyerName || ''}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">${p.lawyerPhone || ''}</td>
          </tr>`;
      }

      // Build sessions log rows (existing + 10 empty)
      const existingSessionRows = sessions.map(s => `
        <tr>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">${s.date || ''}</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;"></td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;"></td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">${s.result || ''}</td>
        </tr>
      `).join('');

      const emptySessionRows = Array.from({ length: Math.max(10, 10 - sessions.length) }).map(() => `
        <tr>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;">___/___/202_</td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;"></td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;"></td>
          <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:12px;"></td>
        </tr>
      `).join('');

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>ملف القضية - ${caseData.caseNumber || ''}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      color: #000;
      font-size: 13px;
      line-height: 1.6;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      margin: 0 auto;
      background: #fff;
    }
    .page-break {
      page-break-after: always;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      font-size: 11px;
      color: #333;
    }
    .lawyer-card {
      border: 2px solid #000;
      padding: 12px 16px;
      margin-bottom: 20px;
      background: #f9f9f9;
    }
    .lawyer-card h3 {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 6px;
      color: #000;
    }
    .lawyer-card p {
      font-size: 12px;
      margin-bottom: 2px;
      color: #333;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #1a5276;
      border-bottom: 2px solid #1a5276;
      padding-bottom: 4px;
      margin-bottom: 10px;
      margin-top: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th {
      background: #1a5276;
      color: #fff;
      font-weight: bold;
      padding: 8px;
      text-align: center;
      font-size: 12px;
    }
    td {
      border: 1px solid #000;
      padding: 6px 8px;
      font-size: 12px;
    }
    .label {
      font-weight: bold;
      color: #1a5276;
    }
    .judgment-area {
      border: 2px solid #000;
      min-height: 150px;
      padding: 12px;
      margin-top: 10px;
      white-space: pre-wrap;
      line-height: 2;
    }
    .info-table td:first-child {
      font-weight: bold;
      color: #1a5276;
      width: 25%;
      background: #f0f4f8;
    }
    @media print {
      body { margin: 0; }
      .page { margin: 0; padding: 15mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

<!-- الصفحة الأولى: بطاقة تتبع القضية -->
<div class="page page-break">
  <div class="header">
    <span>${timestamp}</span>
    <span style="font-weight:bold;">${caseData.caseNumber || ''}</span>
  </div>

  <div class="lawyer-card">
    <h3>${lawyerName}</h3>
    <p>${lawyerTitle}</p>
    <p>${lawyerAddress}</p>
    <p>الهاتف: ${lawyerPhone}</p>
    <p>البريد الإلكتروني: ${lawyerEmail}</p>
  </div>

  <div class="section-title">معالم القضية</div>
  <table class="info-table">
    <tr>
      <td>رقم القضية</td>
      <td>${caseData.caseNumber || ''}</td>
      <td>المجلس/المحكمة</td>
      <td>${caseData.councilName || caseData.courtName || ''}</td>
    </tr>
    <tr>
      <td>مرحلة التقاضي</td>
      <td>${caseData.litigationStage || ''}</td>
      <td>الغرفة/القسم</td>
      <td>${caseData.chamber || ''}</td>
    </tr>
    <tr>
      <td>الموضوع</td>
      <td colspan="3">${caseData.subject || ''}</td>
    </tr>
  </table>

  <div class="section-title">أطراف النزاع</div>
  <table>
    <thead>
      <tr>
        <th>المركز القانوني</th>
        <th>الاسم واللقب</th>
        <th>الهاتف</th>
        <th>محاميه</th>
        <th>هاتف المحامي</th>
      </tr>
    </thead>
    <tbody>
      ${partyTableRows}
    </tbody>
  </table>

  <div class="section-title">منطق الحكم/القرار</div>
  <div class="judgment-area">${caseData.judgment || ''}</div>
</div>

<!-- الصفحة الثانية: سجل الجلسات والتأجيلات -->
<div class="page">
  <div class="section-title" style="margin-top:0;">سجل الجلسات والتأجيلات</div>
  <table>
    <thead>
      <tr>
        <th style="width:25%;">تاريخ الجلسة</th>
        <th style="width:25%;">السبب</th>
        <th style="width:25%;">تاريخ المداولة</th>
        <th style="width:25%;">النتيجة</th>
      </tr>
    </thead>
    <tbody>
      ${existingSessionRows}
      ${emptySessionRows}
    </tbody>
  </table>
</div>

<script>
  // Auto-print when opened in new window
  window.onload = function() {
    // Small delay to ensure rendering
    setTimeout(function() {
      window.print();
    }, 500);
  };
</script>
</body>
</html>`;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        toast.success('تم فتح ملف القضية للطباعة');
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
      toast.error('حدث خطأ أثناء إنشاء ملف الطباعة');
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
      {loading ? 'جاري التحميل...' : 'طباعة ملف القضية'}
    </Button>
  );
}
