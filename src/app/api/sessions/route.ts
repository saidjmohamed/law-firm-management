import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

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

    const sessionDate = toDateOrNull(date);

    const session = await prisma.session.create({
      data: {
        caseId: caseId ?? null,
        caseNumber: caseNumber ?? '',
        date: sessionDate,
        time: time ?? '',
        court: court ?? '',
        chamber: chamber ?? '',
        roomNumber: roomNumber ?? '',
        notes: notes ?? '',
        status: status ?? 'scheduled',
        result: result ?? '',
      },
    });

    // ========================================================================
    // Smart Task: إنشاء مهمة "جلسة" مرتبطة بالجلسة الجديدة
    // مع reminder_offsets [7, 1, 0] (قبل 7 أيام + قبل يوم + يوم الجلسة)
    // التذكيرات تُحسب ديناميكياً عند العرض، فلا حاجة لتحديثها عند التأجيل
    // ========================================================================
    if (sessionDate) {
      try {
        const relatedCase = caseId
          ? await prisma.case.findUnique({ where: { id: caseId }, select: { caseNumber: true, subject: true, clientId: true } })
          : null;

        await prisma.task.create({
          data: {
            title: `جلسة ${caseNumber || relatedCase?.caseNumber || ''} ${time ? `الساعة ${time}` : ''}`.trim(),
            description: `${court || ''} ${chamber ? `— ${chamber}` : ''}`.trim(),
            taskType: 'session',
            priority: 'high',
            status: 'pending',
            dueDate: sessionDate,
            reminderOffsets: JSON.stringify([7, 1, 0]),
            sourceType: 'session',
            sourceId: session.id,
            relatedCaseId: caseId ?? null,
            relatedClientId: relatedCase?.clientId ?? null,
            notes: notes || null,
          },
        });
      } catch (taskErr) {
        // فشل إنشاء المهمة لا يمنع نجاح الجلسة
        console.error('Failed to create smart task for session:', taskErr);
      }
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
