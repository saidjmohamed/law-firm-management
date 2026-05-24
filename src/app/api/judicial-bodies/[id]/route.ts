import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const judicialBody = await prisma.judicialBody.findUnique({
      where: { id: parseInt(id) },
    });

    if (!judicialBody) {
      return NextResponse.json({ error: 'Judicial body not found' }, { status: 404 });
    }

    return NextResponse.json(judicialBody);
  } catch (error) {
    console.error('Error fetching judicial body:', error);
    return NextResponse.json({ error: 'Failed to fetch judicial body' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const judicialBody = await prisma.judicialBody.update({
      where: { id: parseInt(id) },
      data: body,
    });

    return NextResponse.json(judicialBody);
  } catch (error) {
    console.error('Error updating judicial body:', error);
    return NextResponse.json({ error: 'Failed to update judicial body' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.judicialBody.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Judicial body deleted' });
  } catch (error) {
    console.error('Error deleting judicial body:', error);
    return NextResponse.json({ error: 'Failed to delete judicial body' }, { status: 500 });
  }
}
