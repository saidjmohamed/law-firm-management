import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const judicialBodies = await prisma.judicialBody.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(judicialBodies);
  } catch (error) {
    console.error('Error fetching judicial bodies:', error);
    return NextResponse.json({ error: 'Failed to fetch judicial bodies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, wilayaId, parentCouncilId, chambers, phones } = body;

    const judicialBody = await prisma.judicialBody.create({
      data: {
        name: name ?? '',
        type: type ?? '',
        wilayaId: wilayaId ?? 16,
        parentCouncilId: parentCouncilId ?? null,
        chambers: chambers ?? '',
        phones: phones ?? '',
      },
    });

    return NextResponse.json(judicialBody, { status: 201 });
  } catch (error) {
    console.error('Error creating judicial body:', error);
    return NextResponse.json({ error: 'Failed to create judicial body' }, { status: 500 });
  }
}
