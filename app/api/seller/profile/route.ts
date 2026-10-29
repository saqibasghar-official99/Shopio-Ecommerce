import { NextRequest, NextResponse } from 'next/server';
import { getSellerFromRequest, hashSellerPassword, verifySellerPassword } from '@/lib/seller-auth';
import { connectDB } from '@/lib/mongodb';
import { Seller } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : seller.name;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : seller.phone;
    if (!name || name.length > 120 || !phone || phone.length > 40) {
      return NextResponse.json({ success: false, message: 'Enter a valid name and phone number.' }, { status: 400 });
    }

    await connectDB();
    const updates: Record<string, unknown> = { name, phone };
    if (body.new_password !== undefined) {
      const currentPassword = typeof body.current_password === 'string' ? body.current_password : '';
      const newPassword = typeof body.new_password === 'string' ? body.new_password : '';
      const user = await Seller.findById(seller._id).select('+password_hash');
      if (!user || !(await verifySellerPassword(currentPassword, user.password_hash))) {
        return NextResponse.json({ success: false, message: 'Current password is incorrect.' }, { status: 401 });
      }
      if (newPassword.length < 10 || newPassword.length > 128) {
        return NextResponse.json({ success: false, message: 'New password must be between 10 and 128 characters.' }, { status: 400 });
      }
      updates.password_hash = await hashSellerPassword(newPassword);
    }
    const updated = await Seller.findByIdAndUpdate(seller._id, updates, { new: true }).select('name email phone referral_code status');
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Seller profile update failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update your profile.' }, { status: 500 });
  }
}
