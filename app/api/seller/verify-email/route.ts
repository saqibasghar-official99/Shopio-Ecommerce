import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Seller } from '@/lib/models';
import { createSellerToken, sellerCookieOptions } from '@/lib/seller-auth';
import { hashSellerOtp, SELLER_OTP_MAX_ATTEMPTS } from '@/lib/server/seller-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address and six-digit code.' }, { status: 400 });
    }

    await connectDB();
    const seller = await Seller.findOne({ email, email_verified: false })
      .select('+email_otp_hash +email_otp_expires_at +email_otp_attempts');
    const now = new Date();
    if (
      !seller ||
      !seller.email_otp_hash ||
      !seller.email_otp_expires_at ||
      seller.email_otp_expires_at <= now ||
      (seller.email_otp_attempts || 0) >= SELLER_OTP_MAX_ATTEMPTS
    ) {
      return NextResponse.json({ success: false, message: 'The code is invalid or expired. Request a new code and try again.' }, { status: 400 });
    }

    const expected = Buffer.from(seller.email_otp_hash, 'hex');
    const supplied = Buffer.from(hashSellerOtp(seller.id, otp), 'hex');
    const matches = expected.length === supplied.length && timingSafeEqual(expected, supplied);

    if (!matches) {
      await Seller.updateOne({
        _id: seller._id,
        email_verified: false,
        email_otp_hash: seller.email_otp_hash,
        email_otp_expires_at: { $gt: now },
        email_otp_attempts: { $lt: SELLER_OTP_MAX_ATTEMPTS },
      }, { $inc: { email_otp_attempts: 1 } });
      return NextResponse.json({ success: false, message: 'The code is invalid or expired. Request a new code and try again.' }, { status: 400 });
    }

    const result = await Seller.updateOne({
      _id: seller._id,
      email_verified: false,
      email_otp_hash: seller.email_otp_hash,
      email_otp_expires_at: { $gt: now },
      email_otp_attempts: { $lt: SELLER_OTP_MAX_ATTEMPTS },
    }, {
      $set: { email_verified: true },
      $unset: {
        email_otp_hash: 1,
        email_otp_expires_at: 1,
        email_otp_attempts: 1,
        email_otp_resend_count: 1,
        email_otp_resend_window_started_at: 1,
        email_otp_last_sent_at: 1,
      },
    });
    if (result.modifiedCount !== 1) {
      return NextResponse.json({ success: false, message: 'The code is invalid or expired. Request a new code and try again.' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      data: { id: seller.id, name: seller.name, email: seller.email, status: seller.status },
      message: 'Email verified successfully. You can now access your seller portal.',
    });
    response.cookies.set('seller_token', createSellerToken(seller.id), sellerCookieOptions());
    return response;
  } catch (error) {
    console.error('Seller email verification failed:', error);
    return NextResponse.json({ success: false, message: 'Could not verify your email. Please try again.' }, { status: 500 });
  }
}
