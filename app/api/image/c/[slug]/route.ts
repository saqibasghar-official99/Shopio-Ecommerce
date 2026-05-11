import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Category } from '@/lib/models';
import { decodeDataUrl, IMAGE_CACHE_HEADERS } from '@/lib/server/dataUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();
    const c = await Category.findOne({ slug })
      .select({ image: 1 })
      .lean<{ image: string }>();

    if (!c || !c.image) return new NextResponse('Not found', { status: 404 });

    const src = c.image;
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
    console.error('Image category route error:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
