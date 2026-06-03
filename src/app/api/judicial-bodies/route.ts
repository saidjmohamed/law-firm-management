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

    // كشف التكرارات - البحث عن هيئة بنفس الاسم والنوع والولاية
    if (name?.trim() && type) {
      const existingBody = await prisma.judicialBody.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          type: type,
          ...(wilayaId ? { wilayaId: wilayaId } : {}),
        },
      });
      if (existingBody) {
        return NextResponse.json(
          { error: 'هيئة قضائية بنفس الاسم والنوع والولاية موجودة بالفعل', duplicate: true, existingRecord: { id: existingBody.id, name: existingBody.name, type: existingBody.type, wilayaId: existingBody.wilayaId } },
          { status: 409 }
        );
      }
    }

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
