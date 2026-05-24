import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    // تحويل الأرقام من String إلى Int إذا لزم
    if (updateData.clientId !== undefined && updateData.clientId !== null) updateData.clientId = parseInt(String(updateData.clientId));
    if (updateData.wilayaId !== undefined && updateData.wilayaId !== null) updateData.wilayaId = parseInt(String(updateData.wilayaId));
    if (updateData.totalFees !== undefined && updateData.totalFees !== null) updateData.totalFees = parseInt(String(updateData.totalFees));
    if (updateData.chamberNumber !== undefined && updateData.chamberNumber !== null) updateData.chamberNumber = parseInt(String(updateData.chamberNumber));

    const updatedCase = await prisma.case.update({
      where: { id: parseInt(id) },
      data: updateData,
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

    // تحويل الأرقام من String إلى Int إذا لزم
    if (updateData.clientId !== undefined && updateData.clientId !== null) updateData.clientId = parseInt(String(updateData.clientId));
    if (updateData.wilayaId !== undefined && updateData.wilayaId !== null) updateData.wilayaId = parseInt(String(updateData.wilayaId));
    if (updateData.totalFees !== undefined && updateData.totalFees !== null) updateData.totalFees = parseInt(String(updateData.totalFees));
    if (updateData.chamberNumber !== undefined && updateData.chamberNumber !== null) updateData.chamberNumber = parseInt(String(updateData.chamberNumber));

    const updatedCase = await prisma.case.update({
      where: { id: parseInt(id) },
      data: updateData,
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
