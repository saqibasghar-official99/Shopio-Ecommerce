import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SiteSettings } from '@/lib/models';
import { decodeDataUrl, IMAGE_CACHE_HEADERS } from '@/lib/server/dataUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ index: string }> }
) {
  try {
    const { index } = await params;
    const idx = parseInt(index, 10);
    if (Number.isNaN(idx) || idx < 0) {
      return new NextResponse('Bad index', { status: 400 });
    }

    await connectDB();
    const s = await SiteSettings.findOne()
      .select({ banners: 1 })
      .lean<{ banners: Array<{ image: string }> }>();

    const src = s?.banners?.[idx]?.image;
    if (!src) return new NextResponse('Not found', { status: 404 });

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
    console.error('Image banner route error:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
