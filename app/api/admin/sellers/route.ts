import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Order, Seller, SellerAuditLog, SellerCommission, SellerPayout, SellerPayoutMethod, SellerRewardClaim } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const filter: Record<string, unknown> = {};
    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
      { phone: { $regex: escapeRegex(search), $options: 'i' } },
      { referral_code: { $regex: escapeRegex(search), $options: 'i' } },
    ];
    const sellers = await Seller.find(filter).select('name email phone referral_code status created_at').sort({ created_at: -1 }).limit(300).lean();
    const ids = sellers.map((seller) => seller._id);
    const [orderCounts, commissions, claims, payouts, payoutMethods] = await Promise.all([
      Order.aggregate([{ $match: { seller_id: { $in: ids } } }, { $group: { _id: '$seller_id', count: { $sum: 1 } } }]),
      SellerCommission.aggregate([{ $match: { seller_id: { $in: ids } } }, { $group: { _id: { seller: '$seller_id', status: '$status' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      SellerRewardClaim.aggregate([{ $match: { seller_id: { $in: ids }, status: { $ne: 'cancelled' } } }, { $group: { _id: '$seller_id', count: { $sum: 1 } } }]),
      SellerPayout.aggregate([
        { $match: { seller_id: { $in: ids } } },
        {
          $group: {
            _id: '$seller_id',
            count: { $sum: 1 },
            paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
          },
        },
      ]),
      SellerPayoutMethod.find({ seller_id: { $in: ids }, is_default: true })
        .select('seller_id provider last_four status')
        .lean(),
    ]);
    const countMap = new Map(orderCounts.map((entry) => [String(entry._id), entry.count]));
    const claimMap = new Map(claims.map((entry) => [String(entry._id), entry.count]));
    const payoutMap = new Map(payouts.map((entry) => [String(entry._id), entry]));
    const payoutMethodMap = new Map(payoutMethods.map((method) => [String(method.seller_id), method]));
    return NextResponse.json({
      success: true,
      data: sellers.map((seller) => ({
        ...seller,
        referred_orders: countMap.get(String(seller._id)) || 0,
        claims: claimMap.get(String(seller._id)) || 0,
        default_payout_method: payoutMethodMap.get(String(seller._id)) || null,
        payouts: payoutMap.get(String(seller._id)) || { count: 0, paid: 0 },
        commissions: commissions.filter((entry) => String(entry._id.seller) === String(seller._id)).map((entry) => ({
          status: entry._id.status,
          amount: entry.amount,
          count: entry.count,
        })),
      })),
    });
  } catch (error) {
    console.error('Admin seller listing failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load sellers.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const status = body.status;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid seller ID.' }, { status: 400 });
    }
    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid seller status.' }, { status: 400 });
    }
    await connectDB();
    const seller = await Seller.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).select('name email phone referral_code status created_at');
    if (!seller) return NextResponse.json({ success: false, message: 'Seller not found.' }, { status: 404 });
    await SellerAuditLog.create({
      actor: admin.email,
      action: 'seller.status_changed',
      target_type: 'seller',
      target_id: seller.id,
      details: { status },
    });
    return NextResponse.json({ success: true, data: seller });
  } catch (error) {
    console.error('Seller status update failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update seller status.' }, { status: 500 });
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
