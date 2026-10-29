import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const referral = request.nextUrl.searchParams.get('ref');
  const response = NextResponse.next();

  if (referral) {
    const code = referral.trim().toUpperCase();
    if (/^[A-Z0-9-]{4,32}$/.test(code)) {
      response.cookies.set('veeo_referral', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
