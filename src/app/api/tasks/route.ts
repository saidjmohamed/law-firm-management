import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toDateOrNull } from '@/lib/date-utils';

// ============================================================================
// GET /api/tasks — قائمة المهام
// query params: ?caseId=1&clientId=2&status=pending&priority=high&taskType=session
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const taskType = searchParams.get('taskType');
    const sourceType = searchParams.get('sourceType');

    const where: Record<string, unknown> = {};
    if (caseId) where.relatedCaseId = parseInt(caseId);
    if (clientId) where.relatedClientId = parseInt(clientId);
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (taskType) where.taskType = taskType;
    if (sourceType) where.sourceType = sourceType;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },        // pending أولاً
        { dueDate: 'asc' },        // الأقرب أولاً
        { legalDeadline: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        relatedCase: { select: { id: true, caseNumber: true, subject: true, status: true } },
        relatedClient: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/tasks — إنشاء مهمة جديدة
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // تنظيف وتحويل البيانات
    const data: Record<string, unknown> = {
      title: (body.title || '').trim(),
      description: body.description ?? '',
      taskType: body.taskType || 'other',
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      dueDate: toDateOrNull(body.dueDate),
      startDate: toDateOrNull(body.startDate),
      legalDeadline: toDateOrNull(body.legalDeadline),
      reminderOffsets: JSON.stringify(body.reminderOffsets ?? [7, 1, 0]),
      sourceType: body.sourceType || 'manual',
      sourceId: body.sourceId ?? null,
      relatedCaseId: body.relatedCaseId ?? null,
      relatedClientId: body.relatedClientId ?? null,
      assignedTo: body.assignedTo ?? null,
      notes: body.notes ?? null,
    };

    if (!data.title) {
      return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 });
    }

    // إذا كانت مهمة قانونية، تأكد من وجود legalDeadline
    if (data.taskType === 'legal_procedure' && !data.legalDeadline) {
      return NextResponse.json(
        { error: 'الإجراء القانوني يتطلب تاريخ أجل نهائي' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({ data: data as any });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
