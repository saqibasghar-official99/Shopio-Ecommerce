import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order, Seller, SellerAuditLog, SellerCommission, SellerPayout, SellerPayoutMethod, SellerRewardClaim } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { getKarachiMonth, getQualifyingOrderCount } from '@/lib/server/sellers';
import { decryptPayoutDetails } from '@/lib/server/seller-payout-methods';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid seller ID.' }, { status: 400 });
    await connectDB();
    const seller = await Seller.findById(id).select('name email phone referral_code status created_at').lean();
    if (!seller) return NextResponse.json({ success: false, message: 'Seller not found.' }, { status: 404 });

    const [orders, commissions, rewardClaims, payouts, payoutMethods, qualifyingSales] = await Promise.all([
      Order.find({ seller_id: seller._id })
        .select('order_number created_at items subtotal discount bank_transfer_discount refunded_amount order_status payment_status seller_order seller_name total delivery_fee')
        .sort({ created_at: -1 })
        .limit(200)
        .lean(),
      SellerCommission.find({ seller_id: seller._id }).select('order_number eligible_amount amount original_amount rate status earning_type created_at').sort({ created_at: -1 }).limit(300).lean(),
      SellerRewardClaim.find({ seller_id: seller._id }).populate('gift_id', 'name').sort({ created_at: -1 }).limit(200).lean(),
      SellerPayout.find({ seller_id: seller._id }).sort({ created_at: -1 }).limit(200).lean(),
      SellerPayoutMethod.find({ seller_id: seller._id })
        .select('provider +encrypted_details last_four status review_note is_default created_at')
        .sort({ is_default: -1, created_at: -1 })
        .lean(),
      getQualifyingOrderCount(seller._id, getKarachiMonth()),
    ]);
    const decodedPayoutMethods = payoutMethods.map((method) => ({
      _id: String(method._id),
      provider: method.provider,
      ...decryptPayoutDetails(method.encrypted_details),
      status: method.status,
      review_note: method.review_note,
      is_default: method.is_default,
      created_at: method.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: { seller, month_key: getKarachiMonth(), qualifying_sales: qualifyingSales, orders, commissions, reward_claims: rewardClaims, payouts, payout_methods: decodedPayoutMethods },
    });
  } catch (error) {
    console.error('Seller detail lookup failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load seller details.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const { id: sellerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return NextResponse.json({ success: false, message: 'Invalid seller ID.' }, { status: 400 });
    }
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid payout review.' }, { status: 400 });
    }
    const methodId = typeof body.method_id === 'string' ? body.method_id : '';
    const status = body.status;
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!mongoose.Types.ObjectId.isValid(methodId) || !['reviewed', 'needs_update'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Choose a valid payout method review status.' }, { status: 400 });
    }
    if (status === 'needs_update' && !note) {
      return NextResponse.json({ success: false, message: 'A note is required when requesting payout detail changes.' }, { status: 400 });
    }
    if (note.length > 500) {
      return NextResponse.json({ success: false, message: 'Review notes must be 500 characters or fewer.' }, { status: 400 });
    }

    await connectDB();
    const method = await SellerPayoutMethod.findOneAndUpdate(
      { _id: methodId, seller_id: sellerId },
      { $set: { status, review_note: note } },
      { new: true, runValidators: true }
    ).select('provider status review_note');
    if (!method) return NextResponse.json({ success: false, message: 'Payout method not found.' }, { status: 404 });
    await SellerAuditLog.create({
      actor: admin.email,
      action: `seller.payout_method_${status}`,
      target_type: 'seller_payout_method',
      target_id: method.id,
      details: { seller_id: sellerId, provider: method.provider, note },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seller payout method review failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update payout method review.' }, { status: 500 });
  }
}
