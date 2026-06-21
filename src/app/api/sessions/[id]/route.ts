import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id: parseInt(id) },
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // تصفية الحقول المسموح بها + تحويل التواريخ
    const allowedFields = ['caseId', 'caseNumber', 'date', 'time', 'court', 'chamber', 'roomNumber', 'notes', 'status', 'result'];
    const cleanData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'date') {
          cleanData[key] = toDateOrNull(body[key]);
        } else if (key === 'caseId') {
          cleanData[key] = body[key] === '' ? null : parseInt(String(body[key]));
        } else {
          cleanData[key] = body[key];
        }
      }
    }

    const session = await prisma.session.update({
      where: { id: parseInt(id) },
      data: cleanData,
    });

    // ========================================================================
    // Smart Task sync: عند تحديث تاريخ الجلسة، حدّث dueDate للمهمة المرتبطة
    // (المهمة الواحدة المرتبطة بالجلسة — لا حاجة لتحديث 3 مهام منفصلة)
    // ========================================================================
    if (cleanData.date !== undefined) {
      try {
        await prisma.task.updateMany({
          where: { sourceType: 'session', sourceId: parseInt(id) },
          data: { dueDate: cleanData.date },
        });
      } catch (taskErr) {
        console.error('Failed to sync smart task with session update:', taskErr);
      }
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.session.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
