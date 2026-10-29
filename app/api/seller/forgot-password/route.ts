import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Seller } from '@/lib/models';
import {
  createSellerOtp,
  hashSellerPasswordResetOtp,
  sendSellerPasswordResetEmail,
  SELLER_OTP_MAX_RESENDS,
  SELLER_OTP_RESEND_COOLDOWN_MS,
  SELLER_OTP_RESEND_WINDOW_MS,
  SELLER_OTP_TTL_MS,
} from '@/lib/server/seller-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const genericResponse = () => NextResponse.json({
  success: true,
  message: 'If a verified seller account exists for that email, a password reset code will be sent.',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address.' }, { status: 400 });
    }

    await connectDB();
    const seller = await Seller.findOne({ email, email_verified: { $ne: false } })
      .select('+password_reset_resend_count +password_reset_resend_window_started_at +password_reset_last_sent_at');
    if (!seller) return genericResponse();

    const now = new Date();
    const lastSentAt = seller.password_reset_last_sent_at ?? null;
    const windowStartedAt = seller.password_reset_resend_window_started_at ?? null;
    const resendCount = seller.password_reset_resend_count || 0;
    if (lastSentAt && now.getTime() - lastSentAt.getTime() < SELLER_OTP_RESEND_COOLDOWN_MS) {
      return genericResponse();
    }

    const resetWindow = !windowStartedAt ||
      now.getTime() - windowStartedAt.getTime() >= SELLER_OTP_RESEND_WINDOW_MS;
    if (!resetWindow && resendCount >= SELLER_OTP_MAX_RESENDS) return genericResponse();

    const otp = createSellerOtp();
    const updated = await Seller.findOneAndUpdate({
      _id: seller._id,
      email_verified: { $ne: false },
      password_reset_last_sent_at: lastSentAt ?? { $exists: false },
    }, {
      $set: {
        password_reset_otp_hash: hashSellerPasswordResetOtp(seller.id, otp),
        password_reset_otp_expires_at: new Date(now.getTime() + SELLER_OTP_TTL_MS),
        password_reset_otp_attempts: 0,
        password_reset_resend_count: resetWindow ? 1 : resendCount + 1,
        password_reset_resend_window_started_at: resetWindow ? now : windowStartedAt,
        password_reset_last_sent_at: now,
      },
    }, { new: true }).select('name email');

    if (!updated) return genericResponse();

    try {
      await sendSellerPasswordResetEmail(updated.email, updated.name, otp);
    } catch (error) {
      console.error('Seller password reset email could not be sent:', error);
      await Seller.updateOne({
        _id: updated._id,
        password_reset_otp_hash: hashSellerPasswordResetOtp(seller.id, otp),
      }, {
        $unset: {
          password_reset_otp_hash: 1,
          password_reset_otp_expires_at: 1,
          password_reset_otp_attempts: 1,
        },
      });
    }

    return genericResponse();
  } catch (error) {
    console.error('Seller password reset request failed:', error);
    return NextResponse.json({ success: false, message: 'Could not request a password reset.' }, { status: 500 });
  }
}
