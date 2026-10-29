import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SellerGift, SellerRewardClaim } from '@/lib/models';
import { getKarachiMonth, getQualifyingOrderCount, getSellerProgram } from '@/lib/server/sellers';
import { getSellerFromRequest } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const seller = await getSellerFromRequest();
  if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });

  let giftId: string;
  try {
    const body = await request.json();
    giftId = typeof body.gift_id === 'string' ? body.gift_id : '';
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(giftId)) {
    return NextResponse.json({ success: false, message: 'Choose a valid reward gift.' }, { status: 400 });
  }

  await connectDB();
  const session = await mongoose.startSession();
  try {
    let claimId = '';
    const monthKey = getKarachiMonth();
    await session.withTransaction(async () => {
      const program = await getSellerProgram();
      const qualifyingSales = await getQualifyingOrderCount(seller._id, monthKey);
      const claimsUsed = await SellerRewardClaim.countDocuments({
        seller_id: seller._id,
        month_key: monthKey,
      }).session(session);
      const priorClaims = await SellerRewardClaim.find({ seller_id: seller._id, month_key: monthKey })
        .sort({ claim_number: -1 })
        .select('claim_number')
        .limit(1)
        .session(session)
        .lean();
      const allowedClaims = Math.min(program.monthly_gift_limit, Math.floor(qualifyingSales / program.monthly_sales_threshold));
      if (claimsUsed >= allowedClaims) throw new Error('REWARD_NOT_ELIGIBLE');

      const gift = await SellerGift.findOneAndUpdate(
        { _id: giftId, is_active: true, stock: { $gt: 0 } },
        { $inc: { stock: -1 } },
        { new: true, session }
      );
      if (!gift) throw new Error('GIFT_UNAVAILABLE');

      const [claim] = await SellerRewardClaim.create([{
        seller_id: seller._id,
        gift_id: gift._id,
        month_key: monthKey,
        claim_number: (priorClaims[0]?.claim_number || 0) + 1,
        status: 'claimed',
      }], { session });
      claimId = claim.id;
    });
    const claim = await SellerRewardClaim.findById(claimId).populate('gift_id', 'name description image_url').lean();
    return NextResponse.json({ success: true, data: claim, message: 'Gift claim submitted.' }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'REWARD_NOT_ELIGIBLE') {
      return NextResponse.json({ success: false, message: 'You do not have an available gift claim yet.' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'GIFT_UNAVAILABLE') {
      return NextResponse.json({ success: false, message: 'This gift is out of stock or unavailable.' }, { status: 409 });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return NextResponse.json({ success: false, message: 'A gift claim was already registered for this reward slot. Refresh the page before trying again.' }, { status: 409 });
    }
    console.error('Seller gift claim failed:', error);
    return NextResponse.json({ success: false, message: 'Could not reserve the gift. Please retry.' }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
