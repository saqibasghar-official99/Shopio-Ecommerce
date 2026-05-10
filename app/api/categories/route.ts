import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Category } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

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

    const data = await Category.find(filter).sort({ sort_order: 1 });

    return NextResponse.json({ success: true, data });
  } catch {
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

    // Auto-generate slug if not provided
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    await connectDB();
    const data = await Category.create(body);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
