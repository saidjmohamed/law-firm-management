import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; const delayId = parseInt(id, 10); if (Number.isNaN(delayId)) { return NextResponse.json({ error: 'Invalid ID' }, { status: 400 }); }
    const delay = await prisma.delay.findUnique({
      where: { id: delayId},
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
            status: true,
          },
        },
      },
    });

    if (!delay) {
      return NextResponse.json({ error: 'Delay not found' }, { status: 404 });
    }

    return NextResponse.json(delay);
  } catch (error) {
    console.error('Error fetching delay:', error);
    return NextResponse.json({ error: 'Failed to fetch delay' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json(); const delayId = parseInt(id, 10); if (Number.isNaN(delayId)) { return NextResponse.json({ error: 'Invalid ID' }, { status: 400 }); }

    // تصفية الحقول - فقط الحقول المسموح بتحديثها
    const allowedFields = ['caseId', 'delayDate', 'reason', 'notes'];
    const cleanData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'delayDate') {
          cleanData[key] = toDateOrNull(body[key]);
        } else if (key === 'caseId') {
          if (body[key] === '' || body[key] === null) { return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 }); } const parsedCaseId = parseInt(String(body[key]), 10); if (Number.isNaN(parsedCaseId)) { return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 }); } cleanData[key] = parsedCaseId;
        } else {
          cleanData[key] = body[key];
        }
      }
    }

    const delay = await prisma.delay.update({
      where: { id: delayId },
      data: cleanData,
    });

    return NextResponse.json(delay);
  } catch (error) {
    console.error('Error updating delay:', error);
    return NextResponse.json({ error: 'Failed to update delay' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; const delayId = parseInt(id, 10); if (Number.isNaN(delayId)) { return NextResponse.json({ error: 'Invalid ID' }, { status: 400 }); }
    await prisma.delay.delete({
      where: { id: delayId },
    });

    return NextResponse.json({ message: 'Delay deleted' });
  } catch (error) {
    console.error('Error deleting delay:', error);
    return NextResponse.json({ error: 'Failed to delete delay' }, { status: 500 });
  }
}
