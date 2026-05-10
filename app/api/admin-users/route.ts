import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AdminUser } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/admin-users - List all admin users
export async function GET() {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await AdminUser.find().select('-password_hash').sort({ created_at: -1 }).lean();
    const data = users.map((u) => ({ ...u, id: u._id }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch admin users' }, { status: 500 });
  }
}

// POST /api/admin-users - Create new admin user
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, phone, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    await connectDB();

    // Check duplicate email
    const existing = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 });
    }

    const user = await AdminUser.create({
      name,
      email: email.toLowerCase(),
      password_hash: password,
      phone: phone || '',
      role: role || 'admin',
    });

    const data = { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.created_at };

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create admin user' }, { status: 500 });
  }
}
