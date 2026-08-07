import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET;
const BYPASS_COOKIE = 'maintenance_bypass';

// Pages with no independent SEO value — logged-in/transactional flows.
// noindex via header (not robots.txt disallow) so Google can still crawl
// and *see* the noindex, rather than being blocked from seeing it at all.
const NOINDEX_PATHS = [
  '/checkout',
  '/account',
  '/login',
  '/signup',
  '/review-order',
  '/callback',
  '/order-success',
  '/coming-soon',
];

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (!MAINTENANCE_MODE) {
    return applyNoindexIfNeeded(pathname, NextResponse.next());
  }

  // Never block: the coming-soon page itself, Next internals, static
  // assets, or API routes (Stripe/Paymob webhooks / admin-ops must keep
  // working even while the storefront is gated).
  if (
    pathname.startsWith('/coming-soon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images')
  ) {
    return applyNoindexIfNeeded(pathname, NextResponse.next());
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
    return applyNoindexIfNeeded(pathname, NextResponse.next());
  }

  // Rewrite (not redirect) so the *requested* URL keeps its own status
  // instead of 30x-ing to /coming-soon — a redirect risks Google indexing
  // the coming-soon page as the canonical target of every URL if
  // maintenance runs long. A rewrite + 503 tells crawlers "temporarily
  // unavailable, try again later" and they'll recheck automatically.
  const url = req.nextUrl.clone();
  url.pathname = '/coming-soon';
  url.search = '';
  const res = NextResponse.rewrite(url, { status: 503 });
  res.headers.set('Retry-After', '3600');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}

function applyNoindexIfNeeded(pathname: string, res: NextResponse) {
  if (NOINDEX_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};