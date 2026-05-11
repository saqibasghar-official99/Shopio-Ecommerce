import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import { Category } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { invalidate } from '@/lib/server/cache';
import { transformCategoryImage } from '@/lib/server/imageTransforms';

export const dynamic = 'force-dynamic';

// GET /api/categories - Public: get categories with optional search
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const raw = await Category.find(filter)
      .select('name slug description image parent_id is_active sort_order')
      .sort({ sort_order: 1 })
      .lean();

    const data = (raw as unknown[]).map((c) =>
      transformCategoryImage(c as { slug?: string; image?: unknown })
    );

    const res = NextResponse.json({ success: true, data });
    // Categories change rarely — cache aggressively
    res.headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=600, stale-while-revalidate=3600'
    );
    return res;
  } catch (err) {
    console.error('Categories GET error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Admin: create category
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    await connectDB();
    const data = await Category.create(body);

    invalidate('categories');
    try {
      revalidatePath('/');
      revalidatePath('/products');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error('Categories POST error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
