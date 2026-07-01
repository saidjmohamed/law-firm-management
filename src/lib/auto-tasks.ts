// ============================================================================
// نظام المهام التلقائية الذكي — Smart Auto-Task Generation
// ============================================================================
// ينشئ مهام تلقائياً بناءً على أحداث القضايا:
// - سحب الأحكام عند تحديد نتيجة القضية (ربحت/خسرت)
// - متابعة الاستئناف/المعارضة/الطعن بالنقض عند الخسارة
// - متابعة التنفيذ عند الربح
// ============================================================================

import prisma from '@/lib/prisma';

// ============================================================================
// أنواع المهام التلقائية
// ============================================================================
interface AutoTaskDefinition {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  sourceType: string;
}

// ============================================================================
// قواعد إنشاء المهام حسب نتيجة الحكم
// ============================================================================
const JUDGMENT_TASK_RULES: Record<string, AutoTaskDefinition[]> = {
  won: [
    {
      title: 'سحب الحكم',
      description: 'تم إنشاء هذه المهمة تلقائياً بعد تسجيل حكم (ربحت القضية). يجب سحب الحكم من المحكمة أولاً قبل البدء في إجراءات التنفيذ.',
      taskType: 'judgment_extract',
      priority: 'high',
      sourceType: 'judgment',
    },
    {
      title: 'متابعة التنفيذ',
      description: 'تم إنشاء هذه المهمة تلقائياً بعد تسجيل حكم (ربحت القضية). يجب البدء بإجراءات التنفيذ بعد سحب الحكم.',
      taskType: 'execution',
      priority: 'high',
      sourceType: 'judgment',
    },
  ],
  lost: [
    {
      title: 'سحب الحكم',
      description: 'تم إنشاء هذه المهمة تلقائياً بعد تسجيل حكم (خسرت القضية). يجب سحب الحكم من المحكمة لمعرفة أسباب الحكم وتحديد الإجراء القانوني المناسب.',
      taskType: 'judgment_extract',
      priority: 'high',
      sourceType: 'judgment',
    },
    {
      title: 'متابعة الاستئناف',
      description: 'تم إنشاء هذه المهمة تلقائياً بعد تسجيل حكم (خسرت القضية). يرجى تحديد أجل الاستئناف بعد سحب الحكم.',
      taskType: 'appeal',
      priority: 'high',
      sourceType: 'judgment',
    },
    {
      title: 'متابعة المعارضة',
      description: 'تم إنشاء هذه المهمة تلقائياً بعد تسجيل حكم (خسرت القضية). يرجى تحديد أجل المعارضة بعد سحب الحكم.',
      taskType: 'appeal',
      priority: 'high',
      sourceType: 'judgment',
    },
    {
      title: 'متابعة الطعن بالنقض',
      description: 'تم إنشاء هذه المهمة تلقائياً بعد تسجيل حكم (خسرت القضية). يرجى تحديد أجل الطعن بالنقض بعد سحب الحكم.',
      taskType: 'appeal',
      priority: 'medium',
      sourceType: 'judgment',
    },
  ],
};

// ============================================================================
// إنشاء المهام التلقائية عند تحديد نتيجة الحكم
// ============================================================================
export async function createJudgmentFollowUpTasks(
  caseId: number,
  caseResult: string,
  caseNumber?: string,
  clientId?: number | null
): Promise<{ created: number; skipped: boolean }> {
  const rules = JUDGMENT_TASK_RULES[caseResult];
  if (!rules) return { created: 0, skipped: false };

  try {
    // التحقق من عدم وجود مهام متابعة سابقة غير مكتملة لهذه القضية
    const existingFollowup = await prisma.task.findFirst({
      where: {
        relatedCaseId: caseId,
        sourceType: 'judgment',
        status: { not: 'completed' },
      },
    });

    if (existingFollowup) {
      return { created: 0, skipped: true };
    }

    // إنشاء المهام التلقائية
    const caseLabel = caseNumber ? `— القضية ${caseNumber}` : '';
    let created = 0;

    for (const rule of rules) {
      await prisma.task.create({
        data: {
          title: `${rule.title} ${caseLabel}`.trim(),
          description: rule.description,
          taskType: rule.taskType,
          priority: rule.priority,
          status: 'pending',
          sourceType: rule.sourceType,
          sourceId: caseId,
          relatedCaseId: caseId,
          relatedClientId: clientId ?? null,
          // الأجل يُترك null — المستخدم يملؤه بعد معرفة القانون
        },
      });
      created++;
    }

    return { created, skipped: false };
  } catch (error) {
    console.error('Failed to create judgment follow-up tasks:', error);
    return { created: 0, skipped: false };
  }
}

// ============================================================================
// إنشاء مهمة سحب الحكم فقط (مهمة أساسية)
// ============================================================================
export async function createJudgmentExtractTask(
  caseId: number,
  caseResult: string,
  caseNumber?: string,
  clientId?: number | null
): Promise<{ created: boolean; taskId?: number }> {
  try {
    // التحقق من عدم وجود مهمة سحب حكم سابقة
    const existing = await prisma.task.findFirst({
      where: {
        relatedCaseId: caseId,
        taskType: 'judgment_extract',
        status: { not: 'completed' },
      },
    });

    if (existing) {
      return { created: false };
    }

    const caseLabel = caseNumber ? `— القضية ${caseNumber}` : '';
    const resultLabel = caseResult === 'won' ? 'ربحت' : 'خسرت';

    const task = await prisma.task.create({
      data: {
        title: `سحب الحكم ${caseLabel}`.trim(),
        description: `تم إنشاء هذه المهمة تلقائياً بعد تسجيل حكم (${resultLabel} القضية). يجب سحب الحكم من المحكمة أولاً قبل أي إجراء آخر.`,
        taskType: 'judgment_extract',
        priority: 'high',
        status: 'pending',
        sourceType: 'judgment',
        sourceId: caseId,
        relatedCaseId: caseId,
        relatedClientId: clientId ?? null,
      },
    });

    return { created: true, taskId: task.id };
  } catch (error) {
    console.error('Failed to create judgment extract task:', error);
    return { created: false };
  }
}
