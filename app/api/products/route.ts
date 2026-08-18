import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import { Product, Category } from '@/lib/models';
import { getAdminFromRequest } from '@/lib/auth';
import { invalidate } from '@/lib/server/cache';
import { transformProductImages } from '@/lib/server/imageTransforms';

// Light projection for list views — never ship heavy description / specifications
// to product listings. $slice on images keeps only the thumbnail, avoiding
// megabytes of base64 per row.
const LIST_PROJECTION = {
  name: 1,
  slug: 1,
  short_description: 1,
  category_id: 1,
  price: 1,
  compare_price: 1,
  cost: 1,
  stock: 1,
  sku: 1,
  weight: 1,
  is_active: 1,
  is_featured: 1,
  tags: 1,
  specifications: 1,
  variants: 1,
  ratings_avg: 1,
  ratings_count: 1,
  created_at: 1,
  // images: { $slice: 1 } as unknown as 1,
  images: 1, // TODO: slice to 1 once we have thumbnails
};

export const dynamic = 'force-dynamic';

// GET /api/products - Public: list products with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const tag = searchParams.get('tag');
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const filter: Record<string, unknown> = { is_active: true };

    if (category) {
      const cat = await Category.findOne({ slug: category }).select('_id').lean<{ _id: unknown }>();
      if (cat) filter.category_id = cat._id;
      else filter.category_id = null; // no results for unknown category
    }

    // if (search) {
    //   const trimmed = search.trim();
    //   if (trimmed.length > 0) {
    //     // Prefer fast text index; fall back to prefix regex on `name` only.
    //     // Using a single field regex keeps the scan small.
    //     filter.$or = [
    //       { $text: { $search: trimmed } },
    //       { name: { $regex: '^' + escapeRegex(trimmed), $options: 'i' } },
    //     ];
    //   }
    // }

    if (search) {
      const trimmed = search.trim();

      if (trimmed.length > 0) {
        const regex = new RegExp(escapeRegex(trimmed), 'i');

        filter.$or = [
          { name: regex },
          { slug: regex },
          { sku: regex },
          { tags: regex },
        ];
      }
    }

    if (featured === 'true') filter.is_featured = true;
    if (tag) filter.tags = tag;

    if (min || max) {
      const priceFilter: Record<string, number> = {};
      if (min) priceFilter.$gte = parseFloat(min);
      if (max) priceFilter.$lte = parseFloat(max);
      filter.price = priceFilter;
    }

    let sortOption: Record<string, 1 | -1> = { created_at: -1 };
    switch (sort) {
      case 'price_asc':
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'best_selling':
      case 'best-selling':
        sortOption = { ratings_count: -1, created_at: -1 };
        break;
      default:
        sortOption = { created_at: -1 };
    }

    const skip = (page - 1) * limit;

    // Run count and find in parallel — was sequential before, cutting one RTT.
    const [total, rawData] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(LIST_PROJECTION)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('category_id', 'name slug')
        .lean(),
    ]);

    // Replace inline base64 images with small API URLs so the JSON payload
    // stays tiny and browsers can cache each image independently.
    // const data = (rawData as unknown[]).map((p) =>
    //   transformProductImages(p as { slug?: string; images?: unknown })
    // );

    const data = rawData;

    const res = NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });

    // Cache public listing for 60s at the edge, stale-while-revalidate for 5m.
    // Browser keeps it for 30s so repeat back-nav is instant.
    res.headers.set(
      'Cache-Control',
      'public, max-age=30, s-maxage=60, stale-while-revalidate=300'
    );
    return res;
  } catch (err) {
    console.error('Products GET error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    await connectDB();

    if (body.category_id && typeof body.category_id === 'string' && !body.category_id.match(/^[0-9a-fA-F]{24}$/)) {
      const cat = await Category.findOne({ slug: body.category_id }).select('_id').lean<{ _id: unknown }>();
      if (cat) body.category_id = cat._id;
    }

    console.log("PRODUCT BODY RECEIVED:", JSON.stringify(body, null, 2));
    const data = await Product.create(body);
    await data.populate('category_id', 'name slug');

    invalidate('products');
    try {
      revalidatePath('/');
      revalidatePath('/products');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error('Products POST error:', err);
    return NextResponse.json(
      { success: false, data: null, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
