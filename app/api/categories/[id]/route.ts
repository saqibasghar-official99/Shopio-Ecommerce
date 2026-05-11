import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import { Category } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { invalidate } from '@/lib/server/cache';

function bust() {
  invalidate('categories');
  try {
    revalidatePath('/');
    revalidatePath('/products');
  } catch {
    // ignore
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const data = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!data) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    bust();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const data = await Category.findByIdAndDelete(id);
    if (!data) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    bust();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}
