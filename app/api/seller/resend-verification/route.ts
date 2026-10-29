import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Seller } from '@/lib/models';
import {
  createSellerOtp,
  hashSellerOtp,
  SELLER_OTP_MAX_RESENDS,
  SELLER_OTP_RESEND_COOLDOWN_MS,
  SELLER_OTP_RESEND_WINDOW_MS,
  SELLER_OTP_TTL_MS,
  sendSellerVerificationEmail,
} from '@/lib/server/seller-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function rateLimited() {
  return NextResponse.json({
    success: false,
    message: 'A code was recently sent or the resend limit was reached. Please try again later.',
  }, { status: 429 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address.' }, { status: 400 });
    }

    await connectDB();
    const seller = await Seller.findOne({ email, email_verified: { $ne: true } })
      .select('+email_otp_resend_count +email_otp_resend_window_started_at +email_otp_last_sent_at');
    if (!seller) {
      return NextResponse.json({ success: true, message: 'If this account needs verification, a code will be sent.' });
    }

    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - SELLER_OTP_RESEND_COOLDOWN_MS);
    const windowCutoff = new Date(now.getTime() - SELLER_OTP_RESEND_WINDOW_MS);
    const lastSentAt = seller.email_otp_last_sent_at ?? null;
    const windowStartedAt = seller.email_otp_resend_window_started_at ?? null;
    const resendCount = seller.email_otp_resend_count || 0;

    if (lastSentAt && lastSentAt > cooldownCutoff) return rateLimited();
    const resetWindow = !windowStartedAt || windowStartedAt <= windowCutoff;
    if (!resetWindow && resendCount >= SELLER_OTP_MAX_RESENDS) return rateLimited();

    const otp = createSellerOtp();
    const updated = await Seller.findOneAndUpdate({
      _id: seller._id,
      email_verified: { $ne: true },
      email_otp_last_sent_at: lastSentAt,
    }, {
      $set: {
        email_verified: false,
        email_otp_hash: hashSellerOtp(seller.id, otp),
        email_otp_expires_at: new Date(now.getTime() + SELLER_OTP_TTL_MS),
        email_otp_attempts: 0,
        email_otp_resend_count: resetWindow ? 1 : resendCount + 1,
        email_otp_resend_window_started_at: resetWindow ? now : windowStartedAt,
        email_otp_last_sent_at: now,
      },
    }, { new: true }).select('name email');

    if (!updated) return rateLimited();

    try {
      await sendSellerVerificationEmail(updated.email, updated.name, otp);
    } catch (error) {
      console.error('Seller verification email could not be resent:', error);
      return NextResponse.json({
        success: false,
        message: 'Could not send the verification email. Check the email configuration and try again later.',
      }, { status: 503 });
    }

    return NextResponse.json({ success: true, message: 'A new verification code was sent to your email.' });
  } catch (error) {
    console.error('Seller verification code resend failed:', error);
    return NextResponse.json({ success: false, message: 'Could not resend the verification code.' }, { status: 500 });
  }
}
