import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    const where = caseId ? { caseId: parseInt(caseId) } : {};

    const parties = await prisma.party.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
          },
        },
      },
    });

    return NextResponse.json(parties);
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json({ error: 'Failed to fetch parties' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, role, side, name, phone, lawyerName, lawyerPhone, totalFees, paidAmount } = body;

    const party = await prisma.party.create({
      data: {
        caseId,
        role: role ?? '',
        side: side ?? 'for',
        name: name ?? '',
        phone: phone ?? '',
        lawyerName: lawyerName ?? '',
        lawyerPhone: lawyerPhone ?? '',
        totalFees: totalFees ?? 0,
        paidAmount: paidAmount ?? 0,
      },
    });

    // إعادة حساب Case.totalFees و Case.paidAmount من أطراف القضية
    await recalculateCaseFees(caseId);

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
}

// دالة مساعدة لإعادة حساب أتعاب القضية من أطرافها
async function recalculateCaseFees(caseId: number) {
  const parties = await prisma.party.findMany({
    where: { caseId, side: 'for' },
  });
  const totalFees = parties.reduce((sum, p) => sum + (p.totalFees || 0), 0);
  const paidAmount = parties.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  await prisma.case.update({
    where: { id: caseId },
    data: { totalFees, paidAmount },
  });
}
