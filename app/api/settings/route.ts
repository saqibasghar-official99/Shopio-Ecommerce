import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SiteSettings } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// In-memory cache for the settings doc — there is only one. This avoids hitting
// MongoDB on every page navigation since settings change rarely.
let settingsCache: { data: unknown; expires: number } | null = null;
const SETTINGS_TTL_MS = 60_000;

// GET /api/settings - Public: return site settings
export async function GET() {
  try {
    const now = Date.now();
    if (settingsCache && settingsCache.expires > now) {
      const res = NextResponse.json({ success: true, data: settingsCache.data });
      res.headers.set(
        'Cache-Control',
        'public, max-age=60, s-maxage=120, stale-while-revalidate=600'
      );
      return res;
    }

    await connectDB();
    let data = await SiteSettings.findOne().lean();

    if (!data) {
      const created = await SiteSettings.create({
        store_name: 'ShopEase',
        currency: '$',
        banners: [],
        announcement_bar: { text: '', isActive: false },
        social_links: {},
      });
      data = created.toObject();
    }

    settingsCache = { data, expires: now + SETTINGS_TTL_MS };

    const res = NextResponse.json({ success: true, data });
    res.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=120, stale-while-revalidate=600'
    );
    return res;
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
      data = await SiteSettings.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    }

    if (!data) {
      data = await SiteSettings.findOneAndUpdate({}, body, { new: true, upsert: true, runValidators: true }).lean();
    }

    // Bust the in-memory cache so the next GET reflects the change
    settingsCache = null;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
