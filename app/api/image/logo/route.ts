import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SiteSettings } from '@/lib/models';
import { decodeDataUrl, IMAGE_CACHE_HEADERS } from '@/lib/server/dataUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();
    const s = await SiteSettings.findOne()
      .select({ logo: 1 })
      .lean<{ logo: string }>();

    if (!s || !s.logo) return new NextResponse('Not found', { status: 404 });

    if (typeof s.logo === 'string' && !s.logo.startsWith('data:')) {
      return NextResponse.redirect(s.logo, 308);
    }

    const decoded = decodeDataUrl(s.logo);
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
    console.error('Image logo route error:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
