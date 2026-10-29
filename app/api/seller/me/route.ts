import { NextResponse } from 'next/server';
import { getSellerFromRequest } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    return NextResponse.json({
      success: true,
      data: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        referral_code: seller.referral_code,
        status: seller.status,
      },
    });
  } catch (error) {
    console.error('Seller session check failed:', error);
    return NextResponse.json({ success: false, message: 'Could not verify seller session.' }, { status: 500 });
  }
}
