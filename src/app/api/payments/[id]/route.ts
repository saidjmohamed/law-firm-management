import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
const numericId = parseInt(id, 10);
if (isNaN(numericId) || numericId <= 0 || String(numericId) !== id) {
return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
}
    const payment = await prisma.payment.findUnique({
      where: { id:numericId },
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
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0 || String(numericId) !== id) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    // جلب بيانات الدفعة قبل التحديث لإعادة حساب paidAmount
  
    // تنظيف البيانات - فقط الحقول المسموح بتحديثها
    const { id: _id, createdAt: _ca, updatedAt: _ua, case: _case, ...updateData } = body;
    if (updateData.amount !== undefined && updateData.amount !== null) {
      updateData.amount = parseInt(String(updateData.amount));
      if (isNaN(updateData.amount) || updateData.amount <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
      }
    }
    if (updateData.date !== undefined) {
      updateData.date = toDateOrNull(updateData.date);
    }
    if (updateData.caseId !== undefined) {
      updateData.caseId = updateData.caseId === '' ? null : updateData.caseId;
    }
    const payment = await prisma.$transaction(async (tx) => {
      const oldPayment = await tx.payment.findUnique({
        where: { id: numericId },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: numericId },
        data: updateData,
      });

      const caseIds = new Set(
        [oldPayment?.caseId, updatedPayment.caseId].filter(Boolean) as number[]
      );

      for (const caseId of caseIds) {
        const totalPaid = await tx.payment.aggregate({
          where: {
            caseId,
            type: 'income',
          },
          _sum: { amount: true },
        });
        await tx.case.update({
          where: { id: caseId },
          data: { paidAmount: totalPaid._sum.amount || 0 },
        });
      }

      return updatedPayment;
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

      const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0 || String(numericId) !== id) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: numericId },
      });

      await tx.payment.delete({
        where: { id: numericId },
      });

      if (payment?.caseId && payment.type === 'income') {
        const totalPaid = await tx.payment.aggregate({
          where: {
            caseId: payment.caseId,
            type: 'income',
          },
          _sum: { amount: true },
        });
        await tx.case.update({
          where: { id: payment.caseId },
          data: { paidAmount: totalPaid._sum.amount || 0 },
        });
      }
    });
    return NextResponse.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
