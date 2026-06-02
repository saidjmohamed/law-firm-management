import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — جلب كل النقابات الفريدة من قاعدة البيانات (Autocomplete تراكمي)
export async function GET() {
  try {
    const lawyers = await prisma.lawyer.findMany({
      where: {
        barAssociation: {
          not: '',
          notIn: [''],
        },
      },
      select: { barAssociation: true },
      distinct: ['barAssociation'],
      orderBy: { barAssociation: 'asc' },
    });

    const associations = lawyers
      .map((l) => l.barAssociation)
      .filter((v): v is string => Boolean(v && v.trim()));

    return NextResponse.json(associations);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
