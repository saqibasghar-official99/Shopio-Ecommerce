import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { promisify } from 'util';
import { connectDB } from '@/lib/mongodb';
import SellerModel, { type ISeller, type SellerStatus } from '@/lib/models/Seller';

const pbkdf2Async = promisify(pbkdf2);
const SELLER_COOKIE = 'seller_token';
const SELLER_TOKEN_TTL = '24h';

export function getSellerSecret(): string {
  const secret = process.env.SELLER_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SELLER_JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
}

export async function hashSellerPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await pbkdf2Async(password, salt, 310000, 32, 'sha256');
  return `pbkdf2$310000$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifySellerPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, iterations, saltHex, hashHex] = encoded.split('$');
  if (scheme !== 'pbkdf2' || !iterations || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await pbkdf2Async(password, Buffer.from(saltHex, 'hex'), Number(iterations), expected.length, 'sha256');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSellerToken(sellerId: string): string {
  return jwt.sign({ sub: sellerId, scope: 'seller' }, getSellerSecret(), { expiresIn: SELLER_TOKEN_TTL });
}

export function sellerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24,
    path: '/',
  };
}

async function approveSellerIfDue(
  seller: Pick<ISeller, '_id' | 'status' | 'auto_approve_at'> | null
): Promise<SellerStatus | null> {
  if (!seller || seller.status !== 'pending' || !seller.auto_approve_at || seller.auto_approve_at > new Date()) {
    return seller?.status ?? null;
  }

  const updatedSeller = await SellerModel.findOneAndUpdate(
    {
      _id: seller._id,
      status: 'pending',
      auto_approve_at: { $lte: new Date() },
    },
    { $set: { status: 'approved' }, $unset: { auto_approve_at: 1 } },
    { new: true }
  ).select('status');

  return updatedSeller?.status ?? seller.status;
}

export async function getSellerFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SELLER_COOKIE)?.value;
  if (!token) return null;
  const secret = getSellerSecret();
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    return null;
  }
  if (typeof decoded === 'string' || decoded.scope !== 'seller' || typeof decoded.sub !== 'string') return null;
  await connectDB();
  const seller = await SellerModel.findById(decoded.sub)
    .select('_id name email phone referral_code status email_verified auto_approve_at');
  const status = await approveSellerIfDue(seller);
  if (seller && status) seller.status = status;
  return seller && seller.email_verified !== false ? seller : null;
}
