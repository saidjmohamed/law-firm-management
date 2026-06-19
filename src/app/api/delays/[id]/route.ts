import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const delay = await prisma.delay.findUnique({
      where: { id: parseInt(id) },
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
    const body = await request.json();

    // تصفية الحقول - فقط الحقول المسموح بتحديثها
    const allowedFields = ['caseId', 'delayDate', 'reason', 'notes'];
    const cleanData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'delayDate') {
          cleanData[key] = toDateOrNull(body[key]);
        } else if (key === 'caseId') {
          cleanData[key] = body[key] === '' ? null : parseInt(String(body[key]));
        } else {
          cleanData[key] = body[key];
        }
      }
    }

    const delay = await prisma.delay.update({
      where: { id: parseInt(id) },
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
    const { id } = await params;
    await prisma.delay.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Delay deleted' });
  } catch (error) {
    console.error('Error deleting delay:', error);
    return NextResponse.json({ error: 'Failed to delete delay' }, { status: 500 });
  }
}
