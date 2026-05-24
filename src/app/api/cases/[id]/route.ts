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

    const updatedCase = await prisma.case.update({
      where: { id: parseInt(id) },
      data: body,
    });

    return NextResponse.json(updatedCase);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
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
