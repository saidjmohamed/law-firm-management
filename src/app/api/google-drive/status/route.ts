import { requireDriveAuth } from '@/lib/drive-auth';
import { NextResponse } from 'next/server';
import { getDriveSession } from '@/lib/google-drive';
export async function GET() {
  const denied = await requireDriveAuth(); if (denied) return denied; return NextResponse.json(await getDriveSession() || { connected: false }); }
