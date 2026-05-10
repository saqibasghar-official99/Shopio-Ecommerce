import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/orders/[orderNumber] - Public: track order by order number
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    await connectDB();

    const { orderNumber } = await params;

    const data = await Order.findOne({ order_number: orderNumber });

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[orderNumber] - Admin: update order status/payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { orderNumber } = await params;
    const body = await request.json();

    // Only allow updating status-related fields
    const allowedFields = ['order_status', 'payment_status', 'payment_method', 'notes', 'invoice_url'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const data = await Order.findOneAndUpdate(
      { order_number: orderNumber },
      updates,
      { new: true }
    );

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to update order' },
      { status: 500 }
    );
  }
}
