import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Seller } from '@/lib/models';
import { hashSellerPassword } from '@/lib/seller-auth';
import { hashSellerPasswordResetOtp, SELLER_OTP_MAX_ATTEMPTS } from '@/lib/server/seller-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const invalidCode = () => NextResponse.json({
  success: false,
  message: 'The reset code is invalid or expired. Request a new code and try again.',
}, { status: 400 });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address and six-digit reset code.' }, { status: 400 });
    }
    if (password.length < 10 || password.length > 128) {
      return NextResponse.json({ success: false, message: 'Password must be between 10 and 128 characters.' }, { status: 400 });
    }

    await connectDB();
    const seller = await Seller.findOne({ email, email_verified: { $ne: false } })
      .select('+password_reset_otp_hash +password_reset_otp_expires_at +password_reset_otp_attempts');
    const now = new Date();
    if (
      !seller ||
      !seller.password_reset_otp_hash ||
      !seller.password_reset_otp_expires_at ||
      seller.password_reset_otp_expires_at <= now ||
      (seller.password_reset_otp_attempts || 0) >= SELLER_OTP_MAX_ATTEMPTS
    ) {
      return invalidCode();
    }

    const expected = Buffer.from(seller.password_reset_otp_hash, 'hex');
    const supplied = Buffer.from(hashSellerPasswordResetOtp(seller.id, otp), 'hex');
    const matches = expected.length === supplied.length && timingSafeEqual(expected, supplied);
    if (!matches) {
      await Seller.updateOne({
        _id: seller._id,
        password_reset_otp_hash: seller.password_reset_otp_hash,
        password_reset_otp_expires_at: { $gt: now },
        password_reset_otp_attempts: { $lt: SELLER_OTP_MAX_ATTEMPTS },
      }, { $inc: { password_reset_otp_attempts: 1 } });
      return invalidCode();
    }

    const passwordHash = await hashSellerPassword(password);
    const result = await Seller.updateOne({
      _id: seller._id,
      email_verified: { $ne: false },
      password_reset_otp_hash: seller.password_reset_otp_hash,
      password_reset_otp_expires_at: { $gt: now },
      password_reset_otp_attempts: { $lt: SELLER_OTP_MAX_ATTEMPTS },
    }, {
      $set: { password_hash: passwordHash },
      $unset: {
        password_reset_otp_hash: 1,
        password_reset_otp_expires_at: 1,
        password_reset_otp_attempts: 1,
        password_reset_resend_count: 1,
        password_reset_resend_window_started_at: 1,
        password_reset_last_sent_at: 1,
      },
    });

    if (result.modifiedCount !== 1) return invalidCode();

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Sign in with your new password.',
    });
  } catch (error) {
    console.error('Seller password reset failed:', error);
    return NextResponse.json({ success: false, message: 'Could not reset your password.' }, { status: 500 });
  }
}
