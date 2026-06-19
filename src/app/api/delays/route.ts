import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

export async function GET() {
  try {
    const delays = await prisma.delay.findMany({
      orderBy: { delayDate: 'desc' },
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
    return NextResponse.json(delays);
  } catch (error) {
    console.error('Error fetching delays:', error);
    return NextResponse.json({ error: 'Failed to fetch delays' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, delayDate, reason, notes } = body;

    const delay = await prisma.delay.create({
      data: {
        caseId,
        delayDate: toDateOrNull(delayDate),
        reason: reason ?? '',
        notes: notes ?? '',
      },
    });

    return NextResponse.json(delay, { status: 201 });
  } catch (error) {
    console.error('Error creating delay:', error);
    return NextResponse.json({ error: 'Failed to create delay' }, { status: 500 });
  }
}
