import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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

    const payment = await prisma.payment.create({
      data: {
        caseId: caseId ?? null,
        caseNumber: caseNumber ?? '',
        amount: amount ?? 0,
        type: type ?? 'income',
        category: category ?? '',
        date: date ?? '',
        notes: notes ?? '',
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
