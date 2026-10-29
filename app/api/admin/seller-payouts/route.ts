import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SellerAuditLog, SellerCommission, SellerPayout } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    await connectDB();
    const payouts = await SellerPayout.find().populate('seller_id', 'name email referral_code').sort({ created_at: -1 }).limit(300).lean();
    return NextResponse.json({ success: true, data: payouts });
  } catch (error) {
    console.error('Seller payout list failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load seller payouts.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const body = await request.json();
    const sellerId = typeof body.seller_id === 'string' ? body.seller_id : '';
    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    const method = typeof body.method === 'string' ? body.method.trim() : '';
    if (!mongoose.Types.ObjectId.isValid(sellerId) || !reference || !method) {
      return NextResponse.json({ success: false, message: 'Seller, payout method, and confirmed payment reference are required.' }, { status: 400 });
    }
    if (body.confirmed !== true) return NextResponse.json({ success: false, message: 'Confirm that the transfer has completed before recording a paid payout.' }, { status: 400 });

    await connectDB();
    const session = await mongoose.startSession();
    try {
      let payout: Record<string, unknown> | null = null;
      await session.withTransaction(async () => {
        const available = await SellerCommission.aggregate([
          { $match: { seller_id: new mongoose.Types.ObjectId(sellerId), status: 'available' } },
          { $group: { _id: null, amount: { $sum: '$amount' } } },
        ]).session(session);
        const amount = Number((available[0]?.amount || 0).toFixed(2));
        if (amount <= 0) throw new Error('NO_AVAILABLE_BALANCE');

        const updatedCommissions = await SellerCommission.updateMany(
          { seller_id: sellerId, status: 'available' },
          { $set: { status: 'paid' } },
          { session }
        );
        if (!updatedCommissions.modifiedCount) throw new Error('NO_AVAILABLE_BALANCE');
        const [created] = await SellerPayout.create([{
          seller_id: sellerId,
          amount,
          status: 'paid',
          method,
          reference,
          note: typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : '',
          paid_at: new Date(),
        }], { session });
        await SellerAuditLog.create([{
          actor: admin.email,
          action: 'seller.payout_paid',
          target_type: 'seller_payout',
          target_id: created.id,
          details: { seller_id: sellerId, amount, method, reference },
        }], { session });
        payout = created.toObject();
      });
      return NextResponse.json({ success: true, data: payout }, { status: 201 });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_AVAILABLE_BALANCE') {
      return NextResponse.json({ success: false, message: 'This seller has no available earnings balance.' }, { status: 409 });
    }
    console.error('Seller payout processing failed:', error);
    return NextResponse.json({ success: false, message: 'Could not record the payout.' }, { status: 500 });
  }
}
