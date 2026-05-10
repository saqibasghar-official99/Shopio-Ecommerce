// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from '@/lib/mongodb';
// import { AdminUser } from '@/lib/models';
// import { getAdminFromRequest } from '@/lib/auth';

// // POST /api/seed-admin - Seed default admin user (admin-only)
// export async function GET(request: NextRequest) {
//   try {
//     const admin = await getAdminFromRequest();
//     if (!admin) {
//       return NextResponse.json({ success: false, message: 'Unauthorized - Admin login required' }, { status: 401 });
//     }

//     await connectDB();

//     const defaultAdmins = [
//       { name: 'Admin', email: 'admin@shopease.com', password_hash: 'Admin@2024', phone: '+1234567890', role: 'super_admin' },
//     ];

//     const created = [];
//     for (const adminData of defaultAdmins) {
//       const existing = await AdminUser.findOne({ email: adminData.email });
//       if (!existing) {
//         const user = await AdminUser.create(adminData);
//         created.push({ name: user.name, email: user.email, role: user.role });
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       message: created.length > 0 ? `Created ${created.length} admin user(s)` : 'Default admin already exists',
//       data: created,
//     });
//   } catch (error) {
//     console.error('Seed admin error:', error);
//     return NextResponse.json({ success: false, message: 'Failed to seed admin' }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AdminUser } from "@/lib/models";

// GET /api/seed-admin
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const existing = await AdminUser.findOne({
      email: "admin@shopease.com",
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Admin already exists",
      });
    }

    const admin = await AdminUser.create({
      name: "Admin",
      email: "admin@shopease.com",
      password_hash: "Admin@2024",
      phone: "+1234567890",
      role: "super_admin",
    });

    return NextResponse.json({
      success: true,
      message: "Admin created successfully",
      data: {
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.log("SEED ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error,
      },
      { status: 500 },
    );
  }
}
