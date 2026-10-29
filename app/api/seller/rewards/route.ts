import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SellerGift, SellerRewardClaim } from '@/lib/models';
import { getKarachiMonth, getQualifyingOrderCount, getSellerProgram } from '@/lib/server/sellers';
import { getSellerFromRequest } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });
    await connectDB();
    const monthKey = getKarachiMonth();
    const [program, qualifyingSales, claims, gifts] = await Promise.all([
      getSellerProgram(),
      getQualifyingOrderCount(seller._id, monthKey),
      SellerRewardClaim.find({ seller_id: seller._id }).populate('gift_id', 'name description image_url').sort({ created_at: -1 }).limit(100).lean(),
      SellerGift.find({ is_active: true, stock: { $gt: 0 } }).select('name description image_url stock').sort({ name: 1 }).lean(),
    ]);
    const currentClaims = claims.filter((claim) => claim.month_key === monthKey).length;
    return NextResponse.json({
      success: true,
      data: {
        month_key: monthKey,
        qualifying_sales: qualifyingSales,
        threshold: program.monthly_sales_threshold,
        remaining_sales: Math.max(0, program.monthly_sales_threshold - qualifyingSales),
        monthly_limit: program.monthly_gift_limit,
        claims_used: currentClaims,
        available_claims: Math.max(0, Math.min(program.monthly_gift_limit - currentClaims, Math.floor(qualifyingSales / program.monthly_sales_threshold) - currentClaims)),
        gifts,
        history: claims,
      },
    });
  } catch (error) {
    console.error('Seller rewards failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load rewards.' }, { status: 500 });
  }
}
