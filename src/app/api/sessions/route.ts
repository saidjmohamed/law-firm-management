import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { date: 'desc' },
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
          },
        },
      },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, caseNumber, date, time, court, chamber, roomNumber, notes, status, result } = body;

    const session = await prisma.session.create({
      data: {
        caseId: caseId ?? null,
        caseNumber: caseNumber ?? '',
        date: date ?? '',
        time: time ?? '',
        court: court ?? '',
        chamber: chamber ?? '',
        roomNumber: roomNumber ?? '',
        notes: notes ?? '',
        status: status ?? 'scheduled',
        result: result ?? '',
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
