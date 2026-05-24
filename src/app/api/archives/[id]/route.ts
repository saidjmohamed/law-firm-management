import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const archive = await prisma.archive.findUnique({
      where: { id: parseInt(id) },
      include: {
        case: {
          select: {
            caseNumber: true,
            subject: true,
          },
        },
      },
    });

    if (!archive) {
      return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
    }

    return NextResponse.json(archive);
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json({ error: 'Failed to fetch archive' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.archive.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Archive deleted' });
  } catch (error) {
    console.error('Error deleting archive:', error);
    return NextResponse.json({ error: 'Failed to delete archive' }, { status: 500 });
  }
}
