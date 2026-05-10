import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Coupon } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/coupons - List coupons (admin or public visible-only)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get('visible') === 'true';

    // Public endpoint: only return active + visible coupons
    if (visibleOnly) {
      const now = new Date();
      const data = await Coupon.find({
        is_active: true,
        is_visible: true,
        $or: [
          { expires_at: null },
          { expires_at: { $gte: now } },
        ],
      }).select('code type value min_order').sort({ created_at: -1 });

      return NextResponse.json({ success: true, data });
    }

    // Admin endpoint: return all coupons
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json({ success: false, data: null, message: 'Unauthorized' }, { status: 401 });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const filter = {};
    const total = await Coupon.countDocuments(filter);
    const data = await Coupon.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 });

    return NextResponse.json({ success: true, data, pagination: { page, limit, total } });
  } catch {
    return NextResponse.json({ success: false, data: null, message: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST /api/coupons - Admin: create coupon
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json({ success: false, data: null, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    const data = await Coupon.create({
      code: body.code?.toUpperCase(),
      type: body.type,
      value: body.value,
      min_order: body.min_order || 0,
      max_uses: body.max_uses || 0,
      used_count: 0,
      expires_at: body.expires_at || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      is_visible: body.is_visible !== undefined ? body.is_visible : true,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, data: null, message: 'Failed to create coupon' }, { status: 500 });
  }
}
