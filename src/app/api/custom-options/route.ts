import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) { try {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get('field');
  if (!field) return NextResponse.json([]);

  const options = await prisma.customOption.findMany({
    where: { field },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(options);
} catch { return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 }); } }

export async function POST(req: NextRequest) { try {
  const { field: rawField, value: rawValue, label } = await req.json(); const field = typeof rawField === 'string' ? rawField.trim() : ''; const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!field || !value) return NextResponse.json({ error: 'field و value مطلوبان' }, { status: 400 });

  
    const option = await prisma.customOption.upsert({
      where: { field_value: { field, value } },
      update: label ? { label } : {},
      create: { field, value, label: label || value },
    });
    return NextResponse.json(option);
  } catch {
    return NextResponse.json({ error: 'خطأ في الإضافة' }, { status: 500 });
  }
}
