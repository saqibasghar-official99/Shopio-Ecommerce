import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/lib/models';
import { getSellerFromRequest } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });
    await connectDB();
    const products = await Product.find({ is_active: true })
      .select('name slug short_description price compare_price images stock variants')
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Seller catalog failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load catalogue.' }, { status: 500 });
  }
}
