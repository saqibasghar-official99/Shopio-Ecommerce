import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, SellerCommission } from '@/lib/models';
import { getSellerFromRequest } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });
    await connectDB();
    const orders = await Order.find({ seller_id: seller._id })
      .select('order_number created_at items subtotal discount bank_transfer_discount delivery_fee total refunded_amount order_status payment_method payment_status seller_order customer_name customer_phone customer_email customer_address customer_city delivery_zone')
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    const orderIds = orders.map((order) => order._id);
    const commissions = await SellerCommission.find({ order_id: { $in: orderIds }, seller_id: seller._id })
      .select('order_id eligible_amount amount status earning_type')
      .lean();
    const ledger = new Map(commissions.map((entry) => [String(entry.order_id), entry]));
    return NextResponse.json({
      success: true,
      data: orders.map((order) => {
        const commission = ledger.get(String(order._id));
        return {
          order_number: order.order_number,
          created_at: order.created_at,
          seller_order: order.seller_order || false,
          items: order.items.map((item: {
            name: string;
            qty: number;
            unitPrice: number;
            originalUnitPrice?: number;
            sellerSellingPrice?: number;
            sellerProfit?: number;
            variantSelections?: Array<{ label: string; value: string }>;
          }) => ({
            name: item.name,
            qty: item.qty,
            unit_price: item.unitPrice,
            original_unit_price: item.originalUnitPrice,
            seller_selling_price: item.sellerSellingPrice,
            profit: item.sellerProfit ? Number((item.sellerProfit * item.qty).toFixed(2)) : 0,
            variants: item.variantSelections || [],
          })),
          customer: order.seller_order ? {
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email,
            address: order.customer_address,
            city: order.customer_city,
            delivery_zone: order.delivery_zone,
          } : null,
          total: order.total,
          delivery_fee: order.delivery_fee,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          eligible_sales: Math.max(0, (commission?.eligible_amount ?? (order.seller_order ? order.subtotal : 0)) - (order.refunded_amount || 0)),
          order_status: order.order_status,
          commission_amount: commission?.amount || 0,
          earning_type: commission?.earning_type || 'commission',
          commission_status: commission?.status || 'pending',
        };
      }),
    });
  } catch (error) {
    console.error('Seller orders failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load seller orders.' }, { status: 500 });
  }
}
