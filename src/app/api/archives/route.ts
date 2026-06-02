import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const archives = await prisma.archive.findMany({
      orderBy: { archiveDate: 'desc' },
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
          },
        },
      },
    });
    return NextResponse.json(archives);
  } catch (error) {
    console.error('Error fetching archives:', error);
    return NextResponse.json({ error: 'Failed to fetch archives' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, caseData, archiveDate, reason } = body;

    const archive = await prisma.archive.create({
      data: {
        caseId,
        caseData: caseData ?? '',
        archiveDate: archiveDate ?? '',
        reason: reason ?? '',
      },
    });

    return NextResponse.json(archive, { status: 201 });
  } catch (error) {
    console.error('Error creating archive:', error);
    return NextResponse.json({ error: 'Failed to create archive' }, { status: 500 });
  }
}
