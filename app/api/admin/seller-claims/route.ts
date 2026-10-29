import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SellerAuditLog, SellerGift, SellerRewardClaim } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const transitions: Record<string, string[]> = {
  claimed: ['processing', 'shipped', 'fulfilled', 'cancelled'],
  processing: ['shipped', 'fulfilled', 'cancelled'],
  shipped: ['fulfilled'],
  fulfilled: [],
  cancelled: [],
};

export async function GET() {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    await connectDB();
    const claims = await SellerRewardClaim.find()
      .populate('seller_id', 'name email referral_code')
      .populate('gift_id', 'name image_url')
      .sort({ created_at: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ success: true, data: claims });
  } catch (error) {
    console.error('Seller reward claims failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load reward claims.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromRequest();
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  let id = '';
  let status = '';
  try {
    const body = await request.json();
    id = typeof body.id === 'string' ? body.id : '';
    status = typeof body.status === 'string' ? body.status : '';
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(id) || !['processing', 'shipped', 'fulfilled', 'cancelled'].includes(status)) {
    return NextResponse.json({ success: false, message: 'Invalid claim or fulfilment status.' }, { status: 400 });
  }

  await connectDB();
  const session = await mongoose.startSession();
  try {
    let updatedClaim: Record<string, unknown> | null = null;
    await session.withTransaction(async () => {
      const claim = await SellerRewardClaim.findById(id).session(session);
      if (!claim) throw new Error('CLAIM_NOT_FOUND');
      if (!(transitions[claim.status] || []).includes(status)) throw new Error('INVALID_TRANSITION');

      if (status === 'cancelled') {
        await SellerGift.updateOne({ _id: claim.gift_id }, { $inc: { stock: 1 } }, { session });
      }
      claim.status = status as typeof claim.status;
      await claim.save({ session });
      await SellerAuditLog.create([{
        actor: admin.email,
        action: 'seller.reward_claim_status_changed',
        target_type: 'seller_reward_claim',
        target_id: claim.id,
        details: { status },
      }], { session });
      updatedClaim = claim.toObject();
    });
    return NextResponse.json({ success: true, data: updatedClaim });
  } catch (error) {
    if (error instanceof Error && error.message === 'CLAIM_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Reward claim not found.' }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'INVALID_TRANSITION') {
      return NextResponse.json({ success: false, message: 'That fulfilment status transition is not allowed.' }, { status: 409 });
    }
    console.error('Reward claim update failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update reward claim.' }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
