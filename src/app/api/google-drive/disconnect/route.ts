import { NextResponse } from 'next/server';
import { disconnectDrive } from '@/lib/google-drive';
export async function POST() { await disconnectDrive(); return NextResponse.json({ success: true }); }
