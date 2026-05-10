import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { AdminUser } from './types';
import { connectDB } from './mongodb';
import AdminUserModel from './models/AdminUser';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@shopease.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2024';

const COOKIE_NAME = 'admin_token';

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser & { exp: number; role?: string };
    // Accept tokens from both env-var admin and DB admins
    if (decoded.email) {
      return { email: decoded.email, name: decoded.name || 'Admin', role: decoded.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function generateAdminToken(email?: string, name?: string, role?: string): string {
  return jwt.sign(
    { email: email || ADMIN_EMAIL, name: name || 'Admin', role: role || 'super_admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export async function validateAdminFromDB(email: string, password: string): Promise<{ valid: boolean; name?: string; role?: string }> {
  // Check env-var super-admin first
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return { valid: true, name: 'Admin', role: 'super_admin' };
  }

  // Check DB admins
  try {
    await connectDB();
    const admin = await AdminUserModel.findOne({ email: email.toLowerCase() });
    if (admin && admin.password_hash === password) {
      return { valid: true, name: admin.name, role: admin.role };
    }
  } catch (err) {
    console.error('DB admin validation error:', err);
  }

  return { valid: false };
}

export async function getAdminFromRequest(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24,
  path: '/',
};
