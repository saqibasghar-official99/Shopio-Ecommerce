import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, SellerCommission, SellerRewardClaim } from '@/lib/models';
import { getKarachiMonth, getQualifyingOrderCount, getSellerProgram } from '@/lib/server/sellers';
import { getSellerFromRequest } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Sign in to view your seller dashboard.' }, { status: 401 });
    if (seller.status !== 'approved') {
      return NextResponse.json({ success: false, data: { status: seller.status }, message: 'Your account must be approved before using seller features.' }, { status: 403 });
    }

    await connectDB();
    const monthKey = getKarachiMonth();
    const [program, qualifyingSales, lifetimeEligibleSales, referredOrders, commissionTotals, recentOrders, claimsUsed] = await Promise.all([
      getSellerProgram(),
      getQualifyingOrderCount(seller._id, monthKey),
      getQualifyingOrderCount(seller._id),
      Order.countDocuments({ seller_id: seller._id }),
      SellerCommission.aggregate([
        { $match: { seller_id: seller._id } },
        { $group: { _id: '$status', amount: { $sum: '$amount' } } },
      ]),
      Order.find({ seller_id: seller._id })
        .select('order_number created_at items refunded_amount order_status payment_method payment_status seller_order')
        .sort({ created_at: -1 })
        .limit(6)
        .lean(),
      SellerRewardClaim.countDocuments({ seller_id: seller._id, month_key: monthKey }),
    ]);
    const recentCommissions = await SellerCommission.find({
        seller_id: seller._id,
        order_id: { $in: recentOrders.map((order) => order._id) },
    }).select('order_id eligible_amount').lean();
    const eligibleByOrder = new Map(recentCommissions.map((commission) => [String(commission.order_id), commission.eligible_amount]));

    const totals = Object.fromEntries(commissionTotals.map((row) => [row._id, Number(row.amount)]));
    return NextResponse.json({
      success: true,
      data: {
        seller: { id: seller.id, name: seller.name, email: seller.email, phone: seller.phone, referral_code: seller.referral_code },
        month_key: monthKey,
        referred_orders: referredOrders,
        qualifying_sales: qualifyingSales,
        lifetime_eligible_sales: lifetimeEligibleSales,
        reward_threshold: program.monthly_sales_threshold,
        reward_limit: program.monthly_gift_limit,
        reward_progress_sales: Math.max(0, Math.min(
          program.monthly_sales_threshold,
          qualifyingSales - claimsUsed * program.monthly_sales_threshold
        )),
        commissions: {
          pending: totals.pending || 0,
          available: totals.available || 0,
          paid: totals.paid || 0,
          reversed: totals.reversed || 0,
          disputed: totals.disputed || 0,
        },
        recent_orders: recentOrders.map((order) => ({
          order_number: order.order_number,
          created_at: order.created_at,
          items: order.items.map((item: { name: string; qty: number }) => ({ name: item.name, qty: item.qty })),
          eligible_sales: Math.max(0, (eligibleByOrder.get(String(order._id)) || 0) - (order.refunded_amount || 0)),
          order_status: order.order_status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
        })),
      },
    });
  } catch (error) {
    console.error('Seller dashboard data failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load seller dashboard.' }, { status: 500 });
  }
}
