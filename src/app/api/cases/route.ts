import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toDateOrNull } from '@/lib/date-utils';

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        parties: true,
        delays: true,
        sessions: true,
        payments: true,
      },
    });
    return NextResponse.json(cases);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // كشف التكرارات - البحث عن قضية بنفس رقم القضية
    if (body.caseNumber?.trim()) {
      const existingCase = await prisma.case.findFirst({
        where: {
          caseNumber: body.caseNumber.trim(),
        },
      });
      if (existingCase) {
        return NextResponse.json(
          { error: 'قضية بنفس الرقم موجودة بالفعل', duplicate: true, existingRecord: { id: existingCase.id, caseNumber: existingCase.caseNumber, subject: existingCase.subject } },
          { status: 409 }
        );
      }
    }

    const newCase = await prisma.case.create({
      data: {
        caseNumber: body.caseNumber || '',
        subject: body.subject || '',
        caseNature: body.caseNature || '',
        litigationStage: body.litigationStage || '',
        origCaseNumber: body.origCaseNumber || '',
        customStage: body.customStage || '',
        status: body.status || 'جارية',
        clientId: body.clientId ?? null,
        wilayaId: body.wilayaId ?? 16,
        judiciaryType: body.judiciaryType || null,
        courtLevel: body.courtLevel || null,
        courtId: body.courtId || null,
        chamber: body.chamber || '',
        chamberNumber: body.chamberNumber || null,
        councilName: body.councilName || '',
        courtName: body.courtName || '',
        totalFees: body.totalFees ?? 0,
        paidAmount: body.paidAmount ?? 0,
        registrationDate: toDateOrNull(body.registrationDate),
        firstSessionDate: toDateOrNull(body.firstSessionDate),
        delibDate: toDateOrNull(body.delibDate),
        barPhone: body.barPhone || '',
        lawyer: body.lawyer || '',
        notes: body.notes || '',
        judgment: body.judgment || '',
        caseResult: body.caseResult || null,
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
