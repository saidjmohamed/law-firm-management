import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, phone2, address, wilaya, nationalId, notes } = body;

    const client = await prisma.client.create({
      data: {
        name: name || '',
        phone: phone || '',
        phone2: phone2 || '',
        address: address || '',
        wilaya: wilaya ?? 16,
        nationalId: nationalId || '',
        notes: notes || '',
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
