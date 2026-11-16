import { NextRequest, NextResponse } from 'next/server';
import { processDriveSyncQueue, queueDriveSync } from '@/lib/google-drive';
import prisma from '@/lib/prisma';
import { requireDriveAuth } from '@/lib/drive-auth';
export async function POST(request: NextRequest) {
  const denied = await requireDriveAuth(); if (denied) return denied;
  try {
    const { entityType, entityId } = await request.json();
    if (!['client','case'].includes(entityType) || !Number.isInteger(Number(entityId))) return NextResponse.json({ error: 'بيانات المزامنة غير صحيحة' }, { status: 400 });
    await queueDriveSync(entityType, Number(entityId), 'manual-retry');
    await processDriveSyncQueue(30);
    const pending = await prisma.driveSyncJob.findMany({ where: { entityType, entityId: Number(entityId) }, orderBy: { updatedAt: 'desc' }, take: 1 });
    return NextResponse.json({ success: pending[0]?.status === 'done', job: pending[0] || null });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذرت المزامنة' }, { status: 500 }); }
}
