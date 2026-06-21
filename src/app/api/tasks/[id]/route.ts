import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toDateOrNull } from '@/lib/date-utils';

// الحقول المسموح بتحديثها
const ALLOWED_FIELDS = [
  'title', 'description', 'taskType', 'priority', 'status',
  'dueDate', 'startDate', 'legalDeadline',
  'reminderOffsets', 'sourceType', 'sourceId',
  'relatedCaseId', 'relatedClientId',
  'assignedTo', 'notes', 'completedAt',
];

const DATE_FIELDS = ['dueDate', 'startDate', 'legalDeadline', 'completedAt'];

// ============================================================================
// GET /api/tasks/[id]
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        relatedCase: { select: { id: true, caseNumber: true, subject: true } },
        relatedClient: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ============================================================================
// PUT /api/tasks/[id]
// ============================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const cleanData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] === undefined) continue;

      if (DATE_FIELDS.includes(key)) {
        cleanData[key] = toDateOrNull(body[key]);
      } else if (key === 'reminderOffsets') {
        // يقبل array أو string JSON
        const val = body[key];
        cleanData[key] = typeof val === 'string' ? val : JSON.stringify(val ?? [7, 1, 0]);
      } else if (key === 'relatedCaseId' || key === 'sourceId') {
        cleanData[key] = body[key] === '' || body[key] === null ? null : parseInt(String(body[key]));
      } else if (key === 'relatedClientId') {
        cleanData[key] = body[key] === '' || body[key] === null ? null : parseInt(String(body[key]));
      } else if (key === 'status') {
        // عند التحويل إلى completed، سجّل completedAt تلقائياً
        cleanData[key] = body[key];
        if (body[key] === 'completed' && !body.completedAt) {
          cleanData.completedAt = new Date();
        } else if (body[key] !== 'completed') {
          cleanData.completedAt = null;
        }
      } else {
        cleanData[key] = body[key];
      }
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: cleanData,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/tasks/[id]
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
