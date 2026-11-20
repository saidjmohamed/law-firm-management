'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Props = {
  caseId: number;
  tasks?: any[];
};

const value = (input: unknown): string => {
  if (input === null || input === undefined || input === '') return 'غير محدد';
  if (input instanceof Date) return input.toLocaleDateString('en-CA');
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(input)) {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? input : input.slice(0, 10);
  }
  return String(input).trim() || 'غير محدد';
};

const section = (title: string, rows: string[]) =>
  `## ${title}\n\n${rows.length ? rows.join('\n\n') : 'لا توجد بيانات مسجلة.'}\n`;

export function CaseMarkdownExportButton({ caseId, tasks = [] }: Props) {
  const [loading, setLoading] = useState(false);

  async function exportMarkdown() {
    if (loading) return;
    setLoading(true);
    try {
      // جلب النسخة الكاملة من الخادم حتى لا نعتمد على بيانات بطاقة القضية المختصرة.
      const response = await fetch(`/api/cases/${caseId}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('تعذر جلب التفاصيل الكاملة للقضية');
      const c = await response.json();
      const parties = Array.isArray(c.parties) ? c.parties : [];
      const delays = Array.isArray(c.delays) ? c.delays : [];
      const sessions = Array.isArray(c.sessions) ? c.sessions : [];
      const payments = Array.isArray(c.payments) ? c.payments : [];
      const archives = Array.isArray(c.archives) ? c.archives : [];
      const relatedTasks = tasks.filter((task: any) => Number(task.relatedCaseId) === Number(caseId));

      const lines = [
        '# ملف القضية',
        '',
        '> نسخة نصية قابلة للبحث والفهرسة في Google Drive. تم إنشاؤها من تطبيق إدارة مكتب المحاماة.',
        '',
        '## بطاقة تعريفية سريعة',
        '',
        `- **رقم القضية:** ${value(c.caseNumber)}`,
        `- **الموضوع:** ${value(c.subject)}`,
        `- **أسماء الأطراف:** ${parties.map((p: any) => p.name).filter(Boolean).join('، ') || 'غير محدد'}`,
        `- **المحكمة:** ${value(c.courtName)}`,
        `- **المجلس:** ${value(c.councilName)}`,
        `- **الحالة:** ${value(c.status)}`,
        `- **تاريخ آخر تحديث:** ${value(c.updatedAt)}`,
        '',
        section('المعلومات الأساسية', [
          `- طبيعة القضية: ${value(c.caseNature)}`,
          `- مرحلة التقاضي: ${value(c.litigationStage)}`,
          `- رقم القضية الأصلية: ${value(c.origCaseNumber)}`,
          `- نوع القضاء: ${value(c.judiciaryType)}`,
          `- مستوى التقاضي: ${value(c.courtLevel)}`,
          `- الولاية: ${value(c.wilayaId)}`,
          `- الغرفة / القسم: ${value(c.chamber)}`,
          `- رقم الغرفة: ${value(c.chamberNumber)}`,
          `- تاريخ التسجيل: ${value(c.registrationDate)}`,
          `- أول جلسة: ${value(c.firstSessionDate)}`,
          `- تاريخ المداولة: ${value(c.delibDate)}`,
          `- تاريخ الحكم: ${value(c.judgmentDate)}`,
          `- النتيجة: ${value(c.caseResult)}`,
          `- المحامي المكلف: ${value(c.lawyer)}`,
          `- هاتف قاعة المحامين: ${value(c.barPhone)}`,
        ]),
        section('الأطراف', parties.map((p: any, i: number) => [
          `### الطرف ${i + 1}: ${value(p.name)}`,
          `- الصفة / الدور: ${value(p.role)}`,
          `- الجهة: ${value(p.side)}`,
          `- الهاتف: ${value(p.phone)}`,
          `- الهاتف الإضافي: ${value(p.phone2)}`,
          `- العنوان: ${value(p.address)}`,
          `- الولاية: ${value(p.wilaya)}`,
          `- رقم التعريف الوطني: ${value(p.nationalId)}`,
          `- المحامي: ${value(p.lawyerName)}`,
          `- هاتف المحامي: ${value(p.lawyerPhone)}`,
          `- ملاحظات الاتصال: ${value(p.contactNotes)}`,
          `- الأتعاب: ${value(p.totalFees)}`,
          `- المبلغ المدفوع: ${value(p.paidAmount)}`,
        ].join('\n'))),
        section('الجلسات', sessions.map((s: any, i: number) => [
          `### الجلسة ${i + 1} — ${value(s.date)}`,
          `- التوقيت: ${value(s.time)}`,
          `- المحكمة: ${value(s.court)}`,
          `- الغرفة: ${value(s.chamber)}`,
          `- القاعة: ${value(s.roomNumber)}`,
          `- الحالة: ${value(s.status)}`,
          `- النتيجة: ${value(s.result)}`,
          `- ملاحظات: ${value(s.notes)}`,
        ].join('\n'))),
        section('التأجيلات', delays.map((d: any, i: number) => [
          `### التأجيل ${i + 1} — ${value(d.delayDate)}`,
          `- السبب: ${value(d.reason)}`,
          `- ملاحظات: ${value(d.notes)}`,
        ].join('\n'))),
        section('الأحكام والقرارات', [
          `- منطوق الحكم: ${value(c.judgment)}`,
          `- تاريخ الحكم: ${value(c.judgmentDate)}`,
          `- نتيجة القضية: ${value(c.caseResult)}`,
        ]),
        section('المدفوعات والحسابات', [
          `- إجمالي الأتعاب: ${value(c.totalFees)}`,
          `- إجمالي المدفوع: ${value(c.paidAmount)}`,
          ...payments.map((p: any, i: number) => [
            `### الدفعة ${i + 1} — ${value(p.date)}`,
            `- المبلغ: ${value(p.amount)}`,
            `- النوع: ${value(p.type)}`,
            `- التصنيف: ${value(p.category)}`,
            `- ملاحظات: ${value(p.notes)}`,
          ].join('\n')),
        ]),
        section('المهام والإجراءات المرتبطة', relatedTasks.map((t: any, i: number) => [
          `### المهمة ${i + 1}: ${value(t.title)}`,
          `- النوع: ${value(t.taskType)}`,
          `- الوصف: ${value(t.description)}`,
          `- الأولوية: ${value(t.priority)}`,
          `- الحالة: ${value(t.status)}`,
          `- تاريخ الاستحقاق: ${value(t.dueDate)}`,
          `- الأجل القانوني: ${value(t.legalDeadline)}`,
          `- المسؤول: ${value(t.assignedTo)}`,
          `- ملاحظات: ${value(t.notes)}`,
        ].join('\n'))),
        section('الأرشيف', archives.map((a: any, i: number) => [
          `### سجل الأرشيف ${i + 1}`,
          `- تاريخ الأرشفة: ${value(a.archiveDate)}`,
          `- السبب: ${value(a.reason)}`,
          `- بيانات النسخة المؤرشفة: ${value(a.caseData)}`,
        ].join('\n'))),
        section('الملاحظات العامة', [value(c.notes)]),
        '',
        '---',
        `تاريخ إنشاء هذا الملف: ${new Date().toLocaleString('en-GB')}`,
        'ملاحظة: هذا الملف نسخة تصدير مستقلة؛ أي تعديلات لاحقة على القضية تتطلب توليد نسخة جديدة.',
      ];

      const markdown = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
      const blob = new Blob(['\uFEFF', markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeNumber = String(c.caseNumber || caseId).replace(/[^\p{L}\p{N}._-]+/gu, '_');
      link.href = url;
      link.download = `ملف_القضية_${safeNumber}.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('تم إنشاء ملف Markdown وتحميله بنجاح', {
        description: 'يمكنك الآن رفع الملف يدوياً إلى مجلد القضية في Google Drive.',
      });
    } catch (error) {
      console.error('Markdown export failed:', error);
      toast.error(error instanceof Error ? error.message : 'تعذر إنشاء ملف القضية');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={exportMarkdown} disabled={loading} className="touch-target">
      <FileDown className="w-3.5 h-3.5 ml-1" />
      {loading ? 'جارٍ التوليد...' : 'توليد ملف MD'}
    </Button>
  );
}
