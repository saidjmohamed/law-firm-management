import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toDateOrNull } from '@/lib/date-utils';

// حقول التواريخ التي يجب تحويلها من String إلى DateTime
const DATE_FIELDS = ['registrationDate', 'firstSessionDate', 'delibDate', 'judgmentDate'];

function normalizeUpdateData(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...data };

  // تحويل الأرقام
  for (const f of ['clientId', 'wilayaId', 'totalFees', 'paidAmount', 'chamberNumber', 'courtId']) {
    if (out[f] !== undefined && out[f] !== null && out[f] !== '') {
      out[f] = parseInt(String(out[f]));
      if (isNaN(out[f])) delete out[f];
    } else if (out[f] === '') {
      out[f] = null;
    }
  }

  // تحويل التواريخ
  for (const f of DATE_FIELDS) {
    if (out[f] !== undefined) {
      out[f] = toDateOrNull(out[f]);
    }
  }

  // caseResult — السماح بـ null
  if (out.caseResult === '' || out.caseResult === '_none') out.caseResult = null;

  return out;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await prisma.case.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        parties: true,
        delays: true,
        sessions: {
          orderBy: { date: 'desc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
        archives: true,
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'القضية غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(caseData);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // إزالة الحقول العلاقية وغير المسموح بتحديثها مباشرة
    const {
      id: _id,
      createdAt,
      updatedAt,
      client,
      parties,
      delays,
      sessions,
      payments,
      archives,
      ...updateData
    } = body;

    const normalized = normalizeUpdateData(updateData);

    const updatedCase = await prisma.case.update({
      where: { id: parseInt(id) },
      data: normalized,
    });

    return NextResponse.json(updatedCase);
  } catch (error: any) {
    console.error('PUT /api/cases/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // إزالة الحقول العلاقية وغير المسموح بتحديثها مباشرة
    const {
      id: _id,
      createdAt,
      updatedAt,
      client,
      parties,
      delays,
      sessions,
      payments,
      archives,
      ...updateData
    } = body;

    const normalized = normalizeUpdateData(updateData);

    const updatedCase = await prisma.case.update({
      where: { id: parseInt(id) },
      data: normalized,
    });

    return NextResponse.json(updatedCase);
  } catch (error: any) {
    console.error('PATCH /api/cases/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.case.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
