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

    // كشف التكرارات - البحث عن موكل بنفس الاسم (غير حساس لحالة الأحرف)
    if (name?.trim()) {
      const existingByName = await prisma.client.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
        },
      });
      if (existingByName) {
        return NextResponse.json(
          { error: 'موكل بنفس الاسم موجود بالفعل', duplicate: true, existingRecord: { id: existingByName.id, name: existingByName.name, phone: existingByName.phone } },
          { status: 409 }
        );
      }

      // البحث عن موكل بنفس رقم الهاتف
      if (phone?.trim()) {
        const existingByPhone = await prisma.client.findFirst({
          where: {
            phone: phone.trim(),
          },
        });
        if (existingByPhone) {
          return NextResponse.json(
            { error: 'موكل بنفس رقم الهاتف موجود بالفعل', duplicate: true, existingRecord: { id: existingByPhone.id, name: existingByPhone.name, phone: existingByPhone.phone } },
            { status: 409 }
          );
        }
      }
    }

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
