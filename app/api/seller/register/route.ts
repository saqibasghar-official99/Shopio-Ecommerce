import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { Seller } from '@/lib/models';
import { hashSellerPassword } from '@/lib/seller-auth';
import {
  createSellerOtp,
  hashSellerOtp,
  SELLER_OTP_TTL_MS,
  sendSellerVerificationEmail,
} from '@/lib/server/seller-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || phone.length > 40) {
      return NextResponse.json({ success: false, message: 'Enter a valid name, email, and phone number.' }, { status: 400 });
    }
    if (password.length < 10 || password.length > 128) {
      return NextResponse.json({ success: false, message: 'Password must be between 10 and 128 characters.' }, { status: 400 });
    }

    await connectDB();
    const exists = await Seller.exists({ email });
    if (exists) return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });

    const referral_code = randomBytes(6).toString('hex').toUpperCase();
    const now = new Date();
    const otp = createSellerOtp();
    const seller = new Seller({
      name,
      email,
      phone,
      password_hash: await hashSellerPassword(password),
      referral_code,
      status: 'pending',
      email_verified: false,
      email_otp_expires_at: new Date(now.getTime() + SELLER_OTP_TTL_MS),
      email_otp_attempts: 0,
      email_otp_resend_count: 0,
      email_otp_resend_window_started_at: now,
      email_otp_last_sent_at: now,
    });

    seller.email_otp_hash = hashSellerOtp(seller.id, otp);
    await seller.save();
    try {
      await sendSellerVerificationEmail(seller.email, seller.name, otp);
    } catch (error) {
      console.error('Seller verification email could not be sent:', error);
      return NextResponse.json({
        success: false,
        verificationRequired: true,
        message: 'Your application was created, but we could not send the verification email. Check the server email settings, then request a new code after one minute.',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: { id: seller.id, name: seller.name, email: seller.email, status: seller.status },
      message: 'Application submitted. Enter the verification code sent to your email to continue.',
    }, { status: 201 });
  } catch (error) {
    console.error('Seller registration failed:', error);
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Could not submit the seller application.' }, { status: 500 });
  }
}
