import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/auth/me - Check admin session
export async function GET() {
  try {
    const admin = await getAdminFromRequest();

    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
