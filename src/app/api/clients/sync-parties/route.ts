import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/clients/sync-parties
 * مزامنة جميع الأطراف مع جدول الموكلين
 * كل طرف (سواء في حقه أو ضده) يضاف كموكل إذا لم يكن موجوداً
 */
export async function POST() {
  try {
    // جلب جميع الأطراف
    const parties = await prisma.party.findMany({
      select: { name: true, phone: true },
    });

    // جلب جميع الموكلين الحاليين
    const existingClients = await prisma.client.findMany({
      select: { name: true },
    });
    const existingNames = new Set(
      existingClients.map((c) => c.name?.trim().toLowerCase()).filter(Boolean)
    );

    // إيجاد الأطراف التي ليس لها موكل مقابل
    const partiesToSync = parties.filter(
      (p) => p.name?.trim() && !existingNames.has(p.name.trim().toLowerCase())
    );

    // إنشاء موكلين للأطراف المفقودة
    let created = 0;
    for (const party of partiesToSync) {
      try {
        await prisma.client.create({
          data: {
            name: party.name!.trim(),
            phone: party.phone || '',
          },
        });
        created++;
      } catch {
        // تجاهل أخطاء التكرار
      }
    }

    return NextResponse.json({
      success: true,
      synced: created,
      totalParties: parties.length,
      existingClients: existingClients.length,
    });
  } catch (error) {
    console.error('Sync parties error:', error);
    return NextResponse.json(
      { error: 'فشل في مزامنة الأطراف' },
      { status: 500 }
    );
  }
}
