import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get('field');
  if (!field) return NextResponse.json([]);

  const options = await prisma.customOption.findMany({
    where: { field },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const { field, value, label } = await req.json();
  if (!field || !value) return NextResponse.json({ error: 'field و value مطلوبان' }, { status: 400 });

  try {
    const option = await prisma.customOption.upsert({
      where: { field_value: { field, value } },
      update: {},
      create: { field, value, label: label || value },
    });
    return NextResponse.json(option);
  } catch {
    return NextResponse.json({ error: 'خطأ في الإضافة' }, { status: 500 });
  }
}
