import { NextResponse } from 'next/server';
import { getAuthStatus } from '@/lib/auth';

export async function GET() {
  try {
    const authenticated = await getAuthStatus();
    return NextResponse.json({ authenticated });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
