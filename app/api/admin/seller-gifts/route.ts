import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SellerAuditLog, SellerGift, SellerRewardClaim } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    await connectDB();
    const gifts = await SellerGift.find().sort({ created_at: -1 }).lean();
    const claims = await SellerRewardClaim.aggregate([
      { $group: { _id: { gift_id: '$gift_id', status: '$status' }, count: { $sum: 1 } } },
    ]);
    return NextResponse.json({ success: true, data: gifts.map((gift) => ({
      ...gift,
      claims: claims.filter((claim) => String(claim._id.gift_id) === String(gift._id)),
    })) });
  } catch (error) {
    console.error('Seller gifts listing failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load seller gifts.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const stock = Number(body.stock);
    const internalCost = Number(body.internal_cost || 0);
    if (!name || name.length > 160 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(internalCost) || internalCost < 0) {
      return NextResponse.json({ success: false, message: 'Enter a gift name, valid stock, and valid internal cost.' }, { status: 400 });
    }
    await connectDB();
    const gift = await SellerGift.create({
      name,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '',
      image_url: typeof body.image_url === 'string' ? body.image_url.trim() : '',
      stock,
      internal_cost: internalCost,
      is_active: body.is_active !== false,
    });
    await SellerAuditLog.create({ actor: admin.email, action: 'seller.gift_created', target_type: 'seller_gift', target_id: gift.id, details: { name, stock } });
    return NextResponse.json({ success: true, data: gift }, { status: 201 });
  } catch (error) {
    console.error('Seller gift creation failed:', error);
    return NextResponse.json({ success: false, message: 'Could not create seller gift.' }, { status: 500 });
  }
}
