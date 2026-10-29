import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Seller } from '@/lib/models';
import { createSellerToken, sellerCookieOptions, verifySellerPassword } from '@/lib/seller-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });

    await connectDB();
    const seller = await Seller.findOne({ email }).select('+password_hash');
    if (!seller || !(await verifySellerPassword(password, seller.password_hash))) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }
    if (seller.email_verified === false) {
      return NextResponse.json({
        success: false,
        verificationRequired: true,
        message: 'Verify your email address before signing in.',
      }, { status: 403 });
    }
    if (seller.status === 'rejected' || seller.status === 'suspended') {
      return NextResponse.json({ success: false, message: `This seller account is ${seller.status}. Contact support for assistance.` }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      data: { id: seller.id, name: seller.name, email: seller.email, status: seller.status },
    });
    response.cookies.set('seller_token', createSellerToken(seller.id), sellerCookieOptions());
    return response;
  } catch (error) {
    console.error('Seller login failed:', error);
    const message = error instanceof Error && error.message.startsWith('SELLER_JWT_SECRET')
      ? 'Seller login is not configured. Contact the store administrator.'
      : 'Could not sign in.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out.' });
  response.cookies.set('seller_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}
