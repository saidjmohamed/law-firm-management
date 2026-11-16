import { NextResponse } from 'next/server';
import { getDriveSession } from '@/lib/google-drive';
export async function GET() { return NextResponse.json(await getDriveSession() || { connected: false }); }
