import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Order, Seller, SellerAuditLog, SellerCommission, SellerProgram, SellerRewardClaim } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { getSellerProgram } from '@/lib/server/sellers';

export const dynamic = 'force-dynamic';

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
          default_commission_rate: program.default_commission_rate,
          product_rates: program.product_rates,
          category_rates: program.category_rates,
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
    const defaultRate = Number(body.default_commission_rate);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 10000 ||
        !Number.isInteger(limit) || limit < 0 || limit > 100 ||
        !Number.isFinite(defaultRate) || defaultRate < 0 || defaultRate > 100) {
      return NextResponse.json({ success: false, message: 'Enter valid threshold, gift limit, and commission rate values.' }, { status: 400 });
    }
    const parseRules = (rules: unknown, key: 'product_id' | 'category_id') => {
      if (rules === undefined) return undefined;
      if (!Array.isArray(rules) || rules.length > 500) throw new Error('Invalid commission rate rules.');
      return rules.map((rule) => {
        const id = typeof rule?.[key] === 'string' ? rule[key].trim() : '';
        const rate = Number(rule?.rate);
        if (!mongoose.Types.ObjectId.isValid(id) || !Number.isFinite(rate) || rate < 0 || rate > 100) {
          throw new Error('Each commission rule requires a valid record ID and a rate from 0 to 100.');
        }
        return { [key]: id, rate };
      });
    };
    const productRates = parseRules(body.product_rates, 'product_id');
    const categoryRates = parseRules(body.category_rates, 'category_id');
    await connectDB();
    const update: Record<string, unknown> = {
      default_commission_rate: defaultRate,
      monthly_sales_threshold: threshold,
      monthly_gift_limit: limit,
      updated_by: admin.email,
    };
    if (productRates) update.product_rates = productRates;
    if (categoryRates) update.category_rates = categoryRates;
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
    if (error instanceof Error && (error.message.startsWith('Each commission') || error.message.startsWith('Invalid commission'))) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('Seller programme update failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update seller programme settings.' }, { status: 500 });
  }
}
