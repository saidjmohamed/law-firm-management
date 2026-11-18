import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

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

    const { id: _id, createdAt: _ca, updatedAt: _ua, case: _case, ...updateData } = body;
    if (updateData.amount !== undefined && updateData.amount !== null) {
      updateData.amount = parseInt(String(updateData.amount));
    }
    if (updateData.date !== undefined) {
      updateData.date = toDateOrNull(updateData.date);
    }
    if (updateData.caseId !== undefined) {
      updateData.caseId = updateData.caseId === '' || updateData.caseId === null
        ? null
        : parseInt(String(updateData.caseId));
    }

    const payment = await prisma.$transaction(async (tx) => {
      const oldPayment = await tx.payment.findUnique({ where: { id: parseInt(id) } });
      if (!oldPayment) return null;

      const updated = await tx.payment.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      // عند نقل الدفعة أو تغيير نوعها، أعد حساب رصيد القضية القديمة والجديدة معاً.
      const affectedCaseIds = [...new Set(
        [oldPayment.caseId, updated.caseId].filter((caseId): caseId is number => caseId !== null)
      )];

      for (const caseId of affectedCaseIds) {
        const totalPaid = await tx.payment.aggregate({
          where: { caseId, type: 'income' },
          _sum: { amount: true },
        });
        await tx.case.update({
          where: { id: caseId },
          data: { paidAmount: totalPaid._sum.amount || 0 },
        });
      }

      return updated;
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

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

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: parseInt(id) } });
      if (!payment) return null;

      await tx.payment.delete({ where: { id: parseInt(id) } });

      if (payment.caseId && payment.type === 'income') {
        const totalPaid = await tx.payment.aggregate({
          where: { caseId: payment.caseId, type: 'income' },
          _sum: { amount: true },
        });
        await tx.case.update({
          where: { id: payment.caseId },
          data: { paidAmount: totalPaid._sum.amount || 0 },
        });
      }

      return payment;
    });

    if (!result) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
