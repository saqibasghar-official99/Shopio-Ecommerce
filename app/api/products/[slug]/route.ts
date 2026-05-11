import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/products/[slug] - Public: get single product by slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const data = await Product.findOne({ slug })
      .populate('category_id', 'name slug')
      .lean();

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found' },
        { status: 404 }
      );
    }

    const res = NextResponse.json({ success: true, data });
    res.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=120, stale-while-revalidate=600'
    );
    return res;
  } catch (err) {
    console.error('Product slug GET error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[slug] - Admin: update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { slug } = await params;
    const body = await request.json();

    const data = await Product.findOneAndUpdate({ slug }, body, { new: true })
      .populate('category_id', 'name slug')
      .lean();

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Product slug PUT error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[slug] - Admin: delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { slug } = await params;

    const data = await Product.findOneAndDelete({ slug }).lean();

    if (!data) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: null, message: 'Product deleted' });
  } catch (err) {
    console.error('Product slug DELETE error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
