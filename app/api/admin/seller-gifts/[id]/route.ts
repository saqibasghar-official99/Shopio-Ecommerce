import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { SellerAuditLog, SellerGift } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid gift ID.' }, { status: 400 });
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 160);
    if (typeof body.description === 'string') updates.description = body.description.trim().slice(0, 2000);
    if (typeof body.image_url === 'string') updates.image_url = body.image_url.trim();
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
    if (body.stock !== undefined && Number.isInteger(Number(body.stock)) && Number(body.stock) >= 0) updates.stock = Number(body.stock);
    if (body.internal_cost !== undefined && Number.isFinite(Number(body.internal_cost)) && Number(body.internal_cost) >= 0) updates.internal_cost = Number(body.internal_cost);
    if (!Object.keys(updates).length) return NextResponse.json({ success: false, message: 'No valid gift changes supplied.' }, { status: 400 });
    await connectDB();
    const gift = await SellerGift.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!gift) return NextResponse.json({ success: false, message: 'Gift not found.' }, { status: 404 });
    await SellerAuditLog.create({ actor: admin.email, action: 'seller.gift_updated', target_type: 'seller_gift', target_id: id, details: updates });
    return NextResponse.json({ success: true, data: gift });
  } catch (error) {
    console.error('Seller gift update failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update seller gift.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid gift ID.' }, { status: 400 });
    await connectDB();
    const gift = await SellerGift.findByIdAndUpdate(id, { is_active: false }, { new: true });
    if (!gift) return NextResponse.json({ success: false, message: 'Gift not found.' }, { status: 404 });
    await SellerAuditLog.create({ actor: admin.email, action: 'seller.gift_deactivated', target_type: 'seller_gift', target_id: id });
    return NextResponse.json({ success: true, data: gift, message: 'Gift deactivated.' });
  } catch (error) {
    console.error('Seller gift deactivation failed:', error);
    return NextResponse.json({ success: false, message: 'Could not deactivate seller gift.' }, { status: 500 });
  }
}
