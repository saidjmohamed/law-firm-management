import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { date: 'desc' },
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
          },
        },
      },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, caseNumber, amount, type, category, date, notes } = body;

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          caseId: caseId ?? null,
          caseNumber: caseNumber ?? '',
          amount: amount ?? 0,
          type: type ?? 'income',
          category: category ?? '',
          date: toDateOrNull(date),
          notes: notes ?? '',
        },
      });

      // اعتمد النوع الفعلي بعد تطبيق القيمة الافتراضية، ثم حدّث رصيد القضية ذرياً.
      if (created.caseId && created.type === 'income') {
        const totalPaid = await tx.payment.aggregate({
          where: { caseId: created.caseId, type: 'income' },
          _sum: { amount: true },
        });
        await tx.case.update({
          where: { id: created.caseId },
          data: { paidAmount: totalPaid._sum.amount || 0 },
        });
      }

      return created;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
