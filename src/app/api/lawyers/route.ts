import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/lawyers - جلب جميع المحامين
export async function GET() {
  try {
    const lawyers = await prisma.lawyer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { parties: true },
        },
      },
    });
    return NextResponse.json(lawyers);
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    return NextResponse.json({ error: 'فشل في جلب المحامين' }, { status: 500 });
  }
}

// POST /api/lawyers - إنشاء محامي جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, phone2, email, address, wilaya, barNumber, barAssociation, specialty, source, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'اسم المحامي مطلوب' }, { status: 400 });
    }

    // كشف التكرارات - البحث عن محامي بنفس الاسم (غير حساس لحالة الأحرف)
    if (name?.trim()) {
      const existingByName = await prisma.lawyer.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
        },
      });
      if (existingByName) {
        return NextResponse.json(
          { error: 'محامي بنفس الاسم موجود بالفعل', duplicate: true, existingRecord: { id: existingByName.id, name: existingByName.name, phone: existingByName.phone, barNumber: existingByName.barNumber } },
          { status: 409 }
        );
      }

      // البحث عن محامي بنفس رقم القيد
      if (barNumber?.trim()) {
        const existingByBarNumber = await prisma.lawyer.findFirst({
          where: {
            barNumber: barNumber.trim(),
          },
        });
        if (existingByBarNumber) {
          return NextResponse.json(
            { error: 'محامي بنفس رقم القيد موجود بالفعل', duplicate: true, existingRecord: { id: existingByBarNumber.id, name: existingByBarNumber.name, phone: existingByBarNumber.phone, barNumber: existingByBarNumber.barNumber } },
            { status: 409 }
          );
        }
      }
    }

    const lawyer = await prisma.lawyer.create({
      data: {
        name: name || '',
        phone: phone || '',
        phone2: phone2 || '',
        email: email || '',
        address: address || '',
        wilaya: wilaya ?? 16,
        barNumber: barNumber || '',
        barAssociation: barAssociation?.trim() || '',
        specialty: specialty || '',
        source: source || 'manual',
        notes: notes || '',
      },
    });

    return NextResponse.json(lawyer, { status: 201 });
  } catch (error) {
    console.error('Error creating lawyer:', error);
    return NextResponse.json({ error: 'فشل في إنشاء المحامي' }, { status: 500 });
  }
}
