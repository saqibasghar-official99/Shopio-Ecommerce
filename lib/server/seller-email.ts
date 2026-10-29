import { createHmac, randomInt } from 'crypto';
import nodemailer from 'nodemailer';
import { getSellerSecret } from '@/lib/seller-auth';

export const SELLER_OTP_TTL_MS = 5 * 60 * 1000;
export const SELLER_OTP_MAX_ATTEMPTS = 5;
export const SELLER_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const SELLER_OTP_RESEND_WINDOW_MS = 15 * 60 * 1000;
export const SELLER_OTP_MAX_RESENDS = 3;

export function createSellerOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashSellerOtp(sellerId: string, otp: string): string {
  return createHmac('sha256', getSellerSecret())
    .update(`seller-email-verification:${sellerId}:${otp}`)
    .digest('hex');
}

export function hashSellerPasswordResetOtp(sellerId: string, otp: string): string {
  return createHmac('sha256', getSellerSecret())
    .update(`seller-password-reset:${sellerId}:${otp}`)
    .digest('hex');
}

async function getSellerMailTransport() {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!user || !password) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be configured');
  }

  return {
    user,
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: password },
    }),
  };
}

export async function sendSellerVerificationEmail(email: string, name: string, otp: string) {
  const { user, transporter } = await getSellerMailTransport();

  await transporter.sendMail({
    from: user,
    to: email,
    subject: 'Verify your Veeo seller email',
    text: `Hello ${name},\n\nYour Veeo seller verification code is ${otp}. It expires in five minutes and can only be used once.\n\nIf you did not apply to become a seller, you can ignore this email.`,
  });
}

export async function sendSellerPasswordResetEmail(email: string, name: string, otp: string) {
  const { user, transporter } = await getSellerMailTransport();

  await transporter.sendMail({
    from: user,
    to: email,
    subject: 'Reset your Veeo seller password',
    text: `Hello ${name},\n\nYour Veeo seller password reset code is ${otp}. It expires in five minutes and can only be used once.\n\nIf you did not request a password reset, you can ignore this email.`,
  });
}
