'use client';

import React from 'react';
import { db, getSetting, type Case, type Party } from '@/lib/db';
import { WILAYAS, formatDate, ARABIC_DAYS, ARABIC_MONTHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Scale, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface CaseAnnouncementProps {
  caseData: Case;
  parties: Party[];
}

function formatArabicDate(dateStr: string | undefined): string {
  if (!dateStr) return '___/___/________';
  try {
    const d = new Date(dateStr);
    const day = ARABIC_DAYS[d.getDay()];
    const dayNum = d.getDate();
    const month = ARABIC_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${dayNum} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export function CaseAnnouncementButton({ caseData, parties }: CaseAnnouncementProps) {
  const [loading, setLoading] = React.useState(false);

  async function generateAnnouncement() {
    setLoading(true);
    try {
      const lawyerName = await getSetting<string>('lawyerName') || 'سايج محمد';
      const lawyerTitle = await getSetting<string>('lawyerTitle') || 'محام لدى المجلس';
      const lawyerAddress = await getSetting<string>('lawyerAddress') || '';
      const lawyerPhone = await getSetting<string>('lawyerPhone') || '';
      const lawyerEmail = await getSetting<string>('lawyerEmail') || '';

      const wilayaName = WILAYAS.find(w => w.code === caseData.wilayaId)?.name || '';

      // الأطراف
      const plaintiffs = parties.filter(p =>
        p.role === 'مدعي' || p.role === 'مستأنف' || p.role === 'طالب' || p.role === 'ضحية' || p.role === 'مشتكي'
      );
      const defendants = parties.filter(p =>
        p.role === 'مدعى عليه' || p.role === 'مستأنف ضده' || p.role === 'مستأنف عليه' || p.role === 'مطلوب' || p.role === 'متهم' || p.role === 'مشتكى منه' || p.role === 'معارض ضده'
      );
      const others = parties.filter(p =>
        !plaintiffs.includes(p) && !defendants.includes(p)
      );

      // بناء نص المدعين
      const plaintiffText = plaintiffs.length > 0
        ? plaintiffs.map((p, i) => {
            let text = p.name || '—';
            if (p.lawyerName) text += `، بواسطة محاميه الأستاذ ${p.lawyerName}`;
            return text;
          }).join(' و ')
        : '___________________________________';

      // بناء نص المدعى عليهم
      const defendantText = defendants.length > 0
        ? defendants.map((p, i) => {
            let text = p.name || '—';
            if (p.lawyerName) text += `، بواسطة محاميه الأستاذ ${p.lawyerName}`;
            return text;
          }).join(' و ')
        : '___________________________________';

      // أطراف أخرى
      const otherText = others.length > 0
        ? others.map(p => `${p.name || '—'} (${p.role || '—'})`).join('، ')
        : '';

      // المحكمة
      const courtName = caseData.councilName || caseData.courtName || '___________________________________';
      const chamberText = caseData.chamber ? ` - ${caseData.chamber}` : '';
      const fullCourt = courtName + chamberText;

      // تاريخ اليوم
      const today = new Date();
      const todayArabic = formatArabicDate(today.toISOString());

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>إعلان تأسيس الدعوى - ${caseData.caseNumber || ''}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 12mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif;
      direction: rtl;
      color: #1a1a1a;
      font-size: 13px;
      line-height: 2;
      background: #fff;
    }

    .letterhead {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2.5px double #0f766e;
    }
    .letterhead h1 {
      font-size: 18px;
      font-weight: bold;
      color: #0f766e;
      margin-bottom: 2px;
    }
    .letterhead h2 {
      font-size: 13px;
      font-weight: normal;
      color: #374151;
      margin-bottom: 4px;
    }
    .letterhead .contact {
      font-size: 10px;
      color: #6b7280;
    }
    .letterhead .contact span {
      display: inline-block;
      margin: 0 8px;
    }

    .doc-title {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      color: #0f766e;
      margin-bottom: 20px;
      padding: 8px 20px;
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 4px;
    }

    .content {
      text-align: justify;
      text-justify: inter-word;
    }

    .content p {
      margin-bottom: 10px;
      text-indent: 30px;
    }

    .highlight {
      font-weight: bold;
      color: #0f766e;
    }

    .label {
      font-weight: bold;
      display: inline;
    }

    .signature-area {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }

    .signature-box {
      text-align: center;
      width: 200px;
    }

    .signature-line {
      border-top: 1px solid #374151;
      margin-top: 60px;
      padding-top: 4px;
      font-size: 11px;
    }

    .footer-seal {
      margin-top: 30px;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      border-top: 1px dashed #d1d5db;
      padding-top: 8px;
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

  <!-- عنوان الوثيقة -->
  <div class="doc-title">إعلان تأسيس الدعوى</div>

  <!-- محتوى الإعلان -->
  <div class="content">

    <p>
      <span class="label">السيد الرئيس و أعضاء المحكمة الموقرين،</span>
    </p>

    <p>
      يشرف الأستاذ <span class="highlight">${lawyerName}</span>، ${lawyerTitle}، أن يتقدم أمامكم بهذا الإعلان لتأسيس الدعوى التالية:
    </p>

    <p>
      <span class="label">رقم القضية:</span> <span class="highlight">${caseData.caseNumber || '__________________'}</span>
      ${caseData.origCaseNumber ? `&nbsp;&nbsp;&nbsp;<span class="label">رقم القضية الأصلية:</span> ${caseData.origCaseNumber}` : ''}
    </p>

    <p>
      <span class="label">الموضوع:</span> <span class="highlight">${caseData.subject || '__________________'}</span>
    </p>

    <p>
      <span class="label">طبيعة الدعوى:</span> ${caseData.caseNature || '__________________'} &nbsp;&nbsp;&nbsp;
      <span class="label">مرحلة التقاضي:</span> ${caseData.litigationStage || '__________________'}
    </p>

    <p>
      <span class="label">الهيئة القضائية:</span> <span class="highlight">${fullCourt}</span>
      ${wilayaName ? `&nbsp;&nbsp;&nbsp;<span class="label">الولاية:</span> ${wilayaName}` : ''}
    </p>

    <p>
      <span class="label">تاريخ التسجيل:</span> ${formatArabicDate(caseData.registrationDate)}
      ${caseData.firstSessionDate ? `&nbsp;&nbsp;&nbsp;<span class="label">أول جلسة:</span> ${formatArabicDate(caseData.firstSessionDate)}` : ''}
    </p>

    <p style="margin-top:12px;">
      <span class="label">المدعي(ون):</span> ${plaintiffText}
    </p>

    <p>
      <span class="label">المدعى عليه(ون):</span> ${defendantText}
    </p>

    ${otherText ? `<p><span class="label">أطراف أخرى:</span> ${otherText}</p>` : ''}

    <p style="margin-top:14px;">
      حيث أن المدعي(ين) المذكور(ين) أعلاه قد طلب(وا) تمثيلهم في هذه الدعوى، و بناء على ذلك تم تأسيس الدعوى و تسجيلها لدى المحكمة الموقرة أعلاه.
    </p>

    <p>
      و لذلك يلتمس المدعي(ون) من المحكمة الموقرة الحكم لصالحهم وفقا للقانون.
    </p>

    <p>
      حرر بتاريخ: <span class="highlight">${todayArabic}</span>
    </p>

  </div>

  <!-- منطقة التوقيع -->
  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-line">توقيع المحامي</div>
      <div style="font-size:11px;margin-top:2px;">الأستاذ ${lawyerName}</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">ختم المحامي</div>
    </div>
  </div>

  <!-- تذييل -->
  <div class="footer-seal">
    مكتب الأستاذ ${lawyerName} - ${lawyerTitle} - ${lawyerAddress}
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
        toast.success('تم فتح إعلان التأسيس للطباعة');
      } else {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `إعلان-تأسيس-${caseData.caseNumber || 'case'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('تم تحميل إعلان التأسيس');
      }
    } catch (error) {
      console.error('Announcement error:', error);
      toast.error('حدث خطأ أثناء إنشاء الإعلان');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateAnnouncement}
      disabled={loading}
      className="touch-target"
    >
      <Scale className="w-3 h-3 ml-1" />
      {loading ? 'جاري التحميل...' : 'إعلان تأسيس'}
    </Button>
  );
}
