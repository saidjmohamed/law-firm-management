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
            id: true,
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
    const { caseId, role, side, name, phone, lawyerName, lawyerPhone, totalFees, paidAmount, phone2, address, wilaya, nationalId, contactNotes, lawyerId } = body;

    const party = await prisma.party.create({
      data: {
        caseId,
        role: role ?? '',
        side: side ?? 'for',
        name: name ?? '',
        phone: phone ?? '',
        lawyerName: lawyerName ?? '',
        lawyerPhone: lawyerPhone ?? '',
        lawyerId: lawyerId ? Number(lawyerId) : null,
        totalFees: totalFees ?? 0,
        paidAmount: paidAmount ?? 0,
        phone2: phone2 ?? '',
        address: address ?? null,
        wilaya: wilaya ?? 16,
        nationalId: nationalId ?? null,
        contactNotes: contactNotes ?? null,
      },
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
}

