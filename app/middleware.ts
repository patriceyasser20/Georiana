import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET;
const BYPASS_COOKIE = 'maintenance_bypass';

export function middleware(req: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname, searchParams } = req.nextUrl;

  // Never block: the coming-soon page itself, Next internals, static
  // assets, or API routes (Stripe webhooks / admin-ops must keep working
  // even while the storefront is gated).
  if (
    pathname.startsWith('/coming-soon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // Visit yoursite.com/?bypass=YOUR_SECRET once — sets a cookie so you
  // can browse the whole site normally afterward without the param.
  const bypassParam = searchParams.get('bypass');
  if (BYPASS_SECRET && bypassParam === BYPASS_SECRET) {
    const res = NextResponse.next();
    res.cookies.set(BYPASS_COOKIE, BYPASS_SECRET, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  }

  const cookieVal = req.cookies.get(BYPASS_COOKIE)?.value;
  if (BYPASS_SECRET && cookieVal === BYPASS_SECRET) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/coming-soon';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};