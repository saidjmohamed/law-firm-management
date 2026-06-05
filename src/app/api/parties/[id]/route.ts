import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const party = await prisma.party.findUnique({
      where: { id: parseInt(id) },
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
          },
        },
      },
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error fetching party:', error);
    return NextResponse.json({ error: 'Failed to fetch party' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // تنظيف البيانات - تحويل الأرقام
    const updateData: any = { ...body };
    if (updateData.totalFees !== undefined) updateData.totalFees = parseInt(String(updateData.totalFees)) || 0;
    if (updateData.paidAmount !== undefined) updateData.paidAmount = parseInt(String(updateData.paidAmount)) || 0;
    if (updateData.caseId !== undefined) updateData.caseId = parseInt(String(updateData.caseId));
    if (updateData.lawyerId !== undefined) updateData.lawyerId = updateData.lawyerId ? parseInt(String(updateData.lawyerId)) : null;

    const party = await prisma.party.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // إعادة حساب Case.totalFees و Case.paidAmount من أطراف القضية
    if (party.caseId) {
      const caseParties = await prisma.party.findMany({
        where: { caseId: party.caseId, side: 'for' },
      });
      const totalFees = caseParties.reduce((sum, p) => sum + (p.totalFees || 0), 0);
      const paidAmount = caseParties.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      await prisma.case.update({
        where: { id: party.caseId },
        data: { totalFees, paidAmount },
      });
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json({ error: 'Failed to update party' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // جلب بيانات الطرف قبل الحذف لإعادة حساب الأتعاب
    const party = await prisma.party.findUnique({
      where: { id: parseInt(id) },
    });

    await prisma.party.delete({
      where: { id: parseInt(id) },
    });

    // إعادة حساب Case.totalFees و Case.paidAmount
    if (party?.caseId) {
      const caseParties = await prisma.party.findMany({
        where: { caseId: party.caseId, side: 'for' },
      });
      const totalFees = caseParties.reduce((sum, p) => sum + (p.totalFees || 0), 0);
      const paidAmount = caseParties.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      await prisma.case.update({
        where: { id: party.caseId },
        data: { totalFees, paidAmount },
      });
    }

    return NextResponse.json({ message: 'Party deleted' });
  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json({ error: 'Failed to delete party' }, { status: 500 });
  }
}
