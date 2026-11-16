import { NextRequest, NextResponse } from 'next/server';
import { processDriveSyncQueue, queueDriveSync } from '@/lib/google-drive';
import { requireDriveAuth } from '@/lib/drive-auth';
export async function POST(request: NextRequest) {
  const denied = await requireDriveAuth(); if (denied) return denied;
  try {
    const { caseId } = await request.json();
    const id = Number(caseId);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'رقم القضية غير صحيح' }, { status: 400 });
    await queueDriveSync('case', id, 'manual-link');
    await processDriveSyncQueue(10);
    return NextResponse.json({ success: true, message: 'أضيفت القضية إلى قائمة المزامنة' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'فشل ربط القضية' }, { status: 500 });
  }
}
