import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AdminUser } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// PUT /api/admin-users/[id] - Update admin user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email.toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role) updateData.role = body.role;
    if (body.password) updateData.password_hash = body.password;

    await connectDB();
    const user = await AdminUser.findByIdAndUpdate(params.id, updateData, { new: true }).select('-password_hash').lean();

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...user, id: user._id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update admin user' }, { status: 500 });
  }
}

// DELETE /api/admin-users/[id] - Delete admin user
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await AdminUser.findByIdAndDelete(params.id);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Admin user deleted' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete admin user' }, { status: 500 });
  }
}
