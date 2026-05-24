import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
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

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const payment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: body,
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // جلب بيانات الدفعة قبل الحذف لإعادة حساب paidAmount
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
    });

    await prisma.payment.delete({
      where: { id: parseInt(id) },
    });

    // إعادة حساب paidAmount للقضية
    if (payment?.caseId && payment.type === 'income') {
      const totalPaid = await prisma.payment.aggregate({
        where: {
          caseId: payment.caseId,
          type: 'income',
        },
        _sum: { amount: true },
      });
      await prisma.case.update({
        where: { id: payment.caseId },
        data: { paidAmount: totalPaid._sum.amount || 0 },
      });
    }

    return NextResponse.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
