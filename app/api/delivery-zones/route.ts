import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DeliveryZone } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/delivery-zones - Public: list active delivery zones; Admin (?all=true): list all
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    const filter = showAll ? {} : { is_active: true };
    const data = await DeliveryZone.find(filter).sort({ created_at: 1 });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch delivery zones' },
      { status: 500 }
    );
  }
}

// POST /api/delivery-zones - Admin: create delivery zone
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    const data = await DeliveryZone.create({
      name: body.name,
      cities: body.cities || [],
      fee: body.fee || 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to create delivery zone' },
      { status: 500 }
    );
  }
}
