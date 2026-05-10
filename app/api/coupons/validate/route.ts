import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Coupon } from '@/lib/models';

// POST /api/coupons/validate - Public: validate a coupon code
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, data: null, message: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), is_active: true });

    if (!coupon) {
      return NextResponse.json(
        { success: false, data: null, message: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Check expiration
    if (coupon.expires_at) {
      const now = new Date();
      const expiresAt = new Date(coupon.expires_at);
      if (expiresAt < now) {
        return NextResponse.json(
          { success: false, data: null, message: 'Coupon has expired' },
          { status: 400 }
        );
      }
    }

    // Check max uses
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json(
        { success: false, data: null, message: 'Coupon has reached maximum uses' },
        { status: 400 }
      );
    }

    // Check minimum order
    const orderSubtotal = subtotal || 0;
    if (orderSubtotal < coupon.min_order) {
      return NextResponse.json(
        { success: false, data: null, message: `Minimum order amount is ${coupon.min_order}` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = orderSubtotal * (coupon.value / 100);
    } else {
      discount = coupon.value;
    }
    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, orderSubtotal);

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        min_order: coupon.min_order,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
