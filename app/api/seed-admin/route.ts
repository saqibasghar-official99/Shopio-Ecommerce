import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AdminUser } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// POST /api/seed-admin - Seed default admin user (admin-only)
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized - Admin login required' }, { status: 401 });
    }

    await connectDB();

    const defaultAdmins = [
      { name: 'Admin', email: 'admin@shopease.com', password_hash: 'Admin@2024', phone: '+1234567890', role: 'super_admin' },
    ];

    const created = [];
    for (const adminData of defaultAdmins) {
      const existing = await AdminUser.findOne({ email: adminData.email });
      if (!existing) {
        const user = await AdminUser.create(adminData);
        created.push({ name: user.name, email: user.email, role: user.role });
      }
    }

    return NextResponse.json({
      success: true,
      message: created.length > 0 ? `Created ${created.length} admin user(s)` : 'Default admin already exists',
      data: created,
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json({ success: false, message: 'Failed to seed admin' }, { status: 500 });
  }
}
