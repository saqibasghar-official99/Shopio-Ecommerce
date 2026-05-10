import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SiteSettings } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/settings - Public: return site settings
export async function GET() {
  try {
    await connectDB();
    let data = await SiteSettings.findOne();

    if (!data) {
      // Create default settings if none exist
      data = await SiteSettings.create({
        store_name: 'ShopEase',
        currency: '$',
        banners: [],
        announcement_bar: { text: '', isActive: false },
        social_links: {},
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Admin: update site settings
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = body._id || body.id;
    delete body._id;
    delete body.id;
    delete body.__v;

    await connectDB();

    let data;
    if (id) {
      data = await SiteSettings.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    }

    if (!data) {
      // If no id or not found, update the first document or create one
      data = await SiteSettings.findOneAndUpdate({}, body, { new: true, upsert: true, runValidators: true });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
