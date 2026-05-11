import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/lib/models';
import { decodeDataUrl, IMAGE_CACHE_HEADERS } from '@/lib/server/dataUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; index: string }> }
) {
  try {
    const { slug, index } = await params;
    const idx = parseInt(index, 10);
    if (Number.isNaN(idx) || idx < 0) {
      return new NextResponse('Bad index', { status: 400 });
    }

    await connectDB();
    const p = await Product.findOne({ slug })
      .select({ images: 1 })
      .lean<{ images: string[] }>();

    if (!p || !p.images || !p.images[idx]) {
      return new NextResponse('Not found', { status: 404 });
    }

    const src = p.images[idx];

    if (typeof src === 'string' && !src.startsWith('data:')) {
      return NextResponse.redirect(src, 308);
    }

    const decoded = decodeDataUrl(src);
    if (!decoded) return new NextResponse('Invalid image', { status: 400 });

    return new NextResponse(decoded.data, {
      status: 200,
      headers: {
        ...IMAGE_CACHE_HEADERS,
        'Content-Type': decoded.mime,
        'Content-Length': decoded.data.length.toString(),
      },
    });
  } catch (err) {
    console.error('Image product route error:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
