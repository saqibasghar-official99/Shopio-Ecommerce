import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, Product, SellerAuditLog, SellerCommission } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { reconcileSellerCommission, restoreSellerOrderStock } from '@/lib/server/sellers';

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

    if (body.refunded_amount !== undefined) {
      const refundAmount = Number(body.refunded_amount);
      const existingOrder = await Order.findOne({ order_number: orderNumber }).select('_id seller_id subtotal discount bank_transfer_discount refunded_amount payment_status');
      if (!existingOrder) return NextResponse.json({ success: false, data: null, message: 'Order not found' }, { status: 404 });
      const merchandiseNet = Math.max(0,
        existingOrder.subtotal - Number(existingOrder.discount || 0) - Number(existingOrder.bank_transfer_discount || 0)
      );
      const sellerCommission = existingOrder.seller_id
        ? await SellerCommission.findOne({ order_id: existingOrder._id }).select('eligible_amount')
        : null;
      const refundableMerchandise = Math.min(merchandiseNet, sellerCommission?.eligible_amount ?? merchandiseNet);
      if (!Number.isFinite(refundAmount) || refundAmount < existingOrder.refunded_amount || refundAmount > refundableMerchandise) {
        return NextResponse.json({ success: false, data: null, message: 'Refund amount must be between the already recorded refund and the eligible net merchandise amount; delivery is excluded.' }, { status: 400 });
      }
      if (refundAmount > existingOrder.refunded_amount && existingOrder.payment_status !== 'paid') {
        return NextResponse.json({ success: false, data: null, message: 'Only confirmed paid orders can record a merchandise refund.' }, { status: 409 });
      }
      updates.refunded_amount = refundAmount;
      if (refundAmount >= refundableMerchandise && refundableMerchandise > 0) updates.payment_status = 'refunded';
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

    await reconcileSellerCommission(data._id);
    if (data.seller_order && (data.order_status === 'cancelled' || data.payment_status === 'failed')) {
      await restoreSellerOrderStock(data._id);
    }
    if (data.seller_id && (updates.order_status !== undefined || updates.payment_status !== undefined || updates.refunded_amount !== undefined)) {
      await SellerAuditLog.create({
        actor: admin.email,
        action: 'seller.order_eligibility_updated',
        target_type: 'order',
        target_id: data.id,
        details: { order_status: data.order_status, payment_status: data.payment_status, refunded_amount: data.refunded_amount },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to update order' },
      { status: 500 }
    );
  }
}


// DELETE /api/orders/[orderNumber] - Admin: delete order
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const admin = await getAdminFromRequest();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const { orderNumber } = await params;

    const data = await Order.findOneAndDelete({
      order_number: orderNumber,
    });

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    if (data.seller_order && !data.seller_stock_restored) {
      await Promise.all(data.items.map((item: { productId: string; qty: number }) =>
        Product.updateOne({ _id: item.productId }, { $inc: { stock: item.qty } })
      ));
    }

    await SellerCommission.updateOne({ order_id: data._id, status: { $nin: ['paid', 'reversed'] } }, { $set: { status: 'reversed' } });
    if (data.seller_id) {
      await SellerAuditLog.create({
        actor: admin.email,
        action: 'seller.referred_order_deleted',
        target_type: 'order',
        target_id: data.id,
        details: { order_number: data.order_number },
      });
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete order:', error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: 'Failed to delete order',
      },
      { status: 500 }
    );
  }
}