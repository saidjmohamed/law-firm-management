import { requireDriveAuth } from '@/lib/drive-auth';
import { NextResponse } from 'next/server';
import { disconnectDrive } from '@/lib/google-drive';
export async function POST() {
  const denied = await requireDriveAuth(); if (denied) return denied; await disconnectDrive(); return NextResponse.json({ success: true }); }
