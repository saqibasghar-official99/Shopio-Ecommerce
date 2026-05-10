import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product, Category } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/products - Public: list products with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const filter: Record<string, unknown> = { is_active: true };

    // Filter by category slug
    if (category) {
      const cat = await Category.findOne({ slug: category }).lean();
      if (cat) {
        filter.category_id = cat._id;
      }
    }

    // Search by name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Featured filter
    if (featured === 'true') {
      filter.is_featured = true;
    }

    // Sorting
    let sortOption: Record<string, 1 | -1> = { created_at: -1 as const };
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 as const };
        break;
      case 'price_desc':
        sortOption = { price: -1 as const };
        break;
      case 'best_selling':
        sortOption = { ratings_count: -1 as const };
        break;
      case 'newest':
      default:
        sortOption = { created_at: -1 };
        break;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);
    const data = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('category_id', 'name slug');

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Admin: create product
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

    // Convert category slug to _id if needed
    if (body.category_id && typeof body.category_id === 'string' && !body.category_id.match(/^[0-9a-fA-F]{24}$/)) {
      const cat = await Category.findOne({ slug: body.category_id }).lean();
      if (cat) {
        body.category_id = cat._id;
      }
    }

    await connectDB();
    const data = await Product.create(body);
    await data.populate('category_id', 'name slug');

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
