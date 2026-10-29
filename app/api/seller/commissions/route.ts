import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SellerCommission, SellerPayout } from '@/lib/models';
import { getSellerFromRequest } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });
    await connectDB();
    const [commissions, payouts] = await Promise.all([
      SellerCommission.find({ seller_id: seller._id }).select('order_number eligible_amount amount rate status earning_type created_at').sort({ created_at: -1 }).limit(200).lean(),
      SellerPayout.find({ seller_id: seller._id }).select('amount status method reference note paid_at created_at').sort({ created_at: -1 }).limit(100).lean(),
    ]);
    return NextResponse.json({ success: true, data: { commissions, payouts } });
  } catch (error) {
    console.error('Seller earnings failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load earnings.' }, { status: 500 });
  }
}
