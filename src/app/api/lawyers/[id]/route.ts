import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/lawyers/[id] - جلب محامي بالمعرف
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lawyer = await prisma.lawyer.findUnique({
      where: { id: parseInt(id) },
      include: {
        parties: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                subject: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!lawyer) {
      return NextResponse.json({ error: 'المحامي غير موجود' }, { status: 404 });
    }

    return NextResponse.json(lawyer);
  } catch (error) {
    console.error('Error fetching lawyer:', error);
    return NextResponse.json({ error: 'فشل في جلب المحامي' }, { status: 500 });
  }
}

// PUT /api/lawyers/[id] - تحديث محامي
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const lawyer = await prisma.lawyer.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        phone: body.phone,
        phone2: body.phone2,
        email: body.email,
        address: body.address,
        wilaya: body.wilaya,
        barNumber: body.barNumber,
        ...(body.barAssociation !== undefined && { barAssociation: body.barAssociation?.trim() || '' }),
        specialty: body.specialty,
        notes: body.notes,
      },
    });

    return NextResponse.json(lawyer);
  } catch (error) {
    console.error('Error updating lawyer:', error);
    return NextResponse.json({ error: 'فشل في تحديث المحامي' }, { status: 500 });
  }
}

// DELETE /api/lawyers/[id] - حذف محامي
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.lawyer.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lawyer:', error);
    return NextResponse.json({ error: 'فشل في حذف المحامي' }, { status: 500 });
  }
}
