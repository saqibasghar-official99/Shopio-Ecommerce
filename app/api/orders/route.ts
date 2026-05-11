import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, Customer, Coupon, DeliveryZone } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/orders - Admin: list orders with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const payment_status = searchParams.get('payment_status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.order_status = status;
    }

    if (payment_status) {
      filter.payment_status = payment_status;
    }

    if (search) {
      filter.$or = [
        { order_number: { $regex: search, $options: 'i' } },
        { customer_name: { $regex: search, $options: 'i' } },
        { customer_email: { $regex: search, $options: 'i' } },
        { customer_phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) {
        (filter.created_at as Record<string, unknown>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (filter.created_at as Record<string, unknown>).$lte = new Date(dateTo);
      }
    }

    const [total, data] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Place order (guest or logged in)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      customer_city,
      items,
      payment_method,
      couponCode,
      delivery_zone,
      notes,
      is_guest,
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, data: null, message: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    if (!customer_name || !customer_phone) {
      return NextResponse.json(
        { success: false, data: null, message: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    // Generate order number
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const order_number = `ORD-${Date.now()}-${randomSuffix}`;

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.unitPrice * item.qty;
    }

    // Apply coupon discount if provided
    let discount = 0;
    let coupon_code = '';
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, is_active: true });

      if (coupon) {
        const now = new Date();
        const expired = coupon.expires_at && new Date(coupon.expires_at) < now;
        const maxUsed = coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses;
        const minOrderMet = subtotal >= coupon.min_order;

        if (!expired && !maxUsed && minOrderMet) {
          if (coupon.type === 'percent') {
            discount = subtotal * (coupon.value / 100);
          } else {
            discount = coupon.value;
          }
          // Ensure discount doesn't exceed subtotal
          discount = Math.min(discount, subtotal);
          coupon_code = couponCode;
        }
      }
    }

    // Get delivery fee from zone
    let delivery_fee = 0;
    const deliveryZoneName = delivery_zone || '';
    if (deliveryZoneName) {
      const zone = await DeliveryZone.findOne({ name: deliveryZoneName, is_active: true });
      if (zone) {
        delivery_fee = zone.fee;
      }
    }

    const total = subtotal - discount + delivery_fee;

    // Create or find customer
    let customer_id: string | null = null;
    if (customer_email || customer_phone) {
      const orConditions: Record<string, unknown>[] = [];
      if (customer_email) orConditions.push({ email: customer_email });
      if (customer_phone) orConditions.push({ phone: customer_phone });

      const existingCustomer = await Customer.findOne({ $or: orConditions }).limit(1);

      if (existingCustomer) {
        customer_id = existingCustomer._id.toString();
      } else {
        // Create new customer record
        const newCustomer = await Customer.create({
          name: customer_name,
          phone: customer_phone,
          email: customer_email || '',
          address: customer_address || '',
          city: customer_city || '',
          is_guest: is_guest !== false,
        });
        customer_id = newCustomer._id.toString();
      }
    }

    // Insert order
    const order = await Order.create({
      order_number,
      customer_id,
      customer_name,
      customer_phone,
      customer_email: customer_email || '',
      customer_address: customer_address || '',
      customer_city: customer_city || '',
      is_guest: is_guest !== false,
      items,
      subtotal,
      discount,
      delivery_fee,
      total,
      payment_method: payment_method || 'cod',
      payment_status: 'pending',
      order_status: 'pending',
      delivery_zone: deliveryZoneName,
      coupon_code,
      notes: notes || '',
    });

    // Update coupon used_count if applicable
    if (coupon_code) {
      await Coupon.findOneAndUpdate(
        { code: coupon_code },
        { $inc: { used_count: 1 } }
      );
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to place order' },
      { status: 500 }
    );
  }
}
