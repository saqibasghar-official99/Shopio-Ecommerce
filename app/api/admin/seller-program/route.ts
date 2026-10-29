import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, Seller, SellerAuditLog, SellerCommission, SellerProgram, SellerRewardClaim } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { getSellerProgram } from '@/lib/server/sellers';

export const dynamic = 'force-dynamic';

const SELLER_COMMISSION_RATE = 15;

export async function GET() {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    await connectDB();
    const [program, activeSellers, qualifyingOrders, commissions, giftClaims] = await Promise.all([
      getSellerProgram(),
      Seller.countDocuments({ status: 'approved' }),
      Order.countDocuments({ seller_id: { $ne: null }, order_status: 'delivered', payment_status: 'paid' }),
      SellerCommission.aggregate([{ $group: { _id: '$status', amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      SellerRewardClaim.countDocuments({ status: { $ne: 'cancelled' } }),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        program: {
          default_commission_rate: SELLER_COMMISSION_RATE,
          product_rates: [],
          category_rates: [],
          monthly_sales_threshold: program.monthly_sales_threshold,
          monthly_gift_limit: program.monthly_gift_limit,
        },
        statistics: { active_sellers: activeSellers, qualifying_orders: qualifyingOrders, commissions, gift_claims: giftClaims },
      },
    });
  } catch (error) {
    console.error('Seller program settings failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load seller programme settings.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const body = await request.json();
    const threshold = Number(body.monthly_sales_threshold);
    const limit = Number(body.monthly_gift_limit);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 10000 ||
        !Number.isInteger(limit) || limit < 0 || limit > 100) {
      return NextResponse.json({ success: false, message: 'Enter a valid qualifying-sales threshold and monthly gift limit.' }, { status: 400 });
    }
    await connectDB();
    const update: Record<string, unknown> = {
      default_commission_rate: SELLER_COMMISSION_RATE,
      product_rates: [],
      category_rates: [],
      monthly_sales_threshold: threshold,
      monthly_gift_limit: limit,
      updated_by: admin.email,
    };
    const program = await SellerProgram.findOneAndUpdate(
      { key: 'default' },
      { $set: update, $setOnInsert: { key: 'default' } },
      { new: true, upsert: true, runValidators: true }
    );
    await SellerAuditLog.create({
      actor: admin.email,
      action: 'seller.program_updated',
      target_type: 'seller_program',
      target_id: 'default',
      details: update,
    });
    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error('Seller programme update failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update seller programme settings.' }, { status: 500 });
  }
}
