import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET;
const BYPASS_COOKIE = 'maintenance_bypass';
const LOCALE_COOKIE = 'NEXT_LOCALE';

const NOINDEX_PATHS = [
  '/checkout', '/account', '/login', '/signup',
  '/review-order', '/callback', '/order-success', '/coming-soon',
];

function isMaintenanceExempt(pathname: string) {
  return (
    pathname.startsWith('/coming-soon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images')
  );
}

function isLocaleExempt(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/coming-soon')
  );
}

// Checked against the LOCALE-STRIPPED path, so /ar/checkout gets flagged
// the same as /checkout — not just the English version.
function applyNoindexIfNeeded(canonicalPath: string, res: NextResponse) {
  if (NOINDEX_PATHS.some((p) => canonicalPath === p || canonicalPath.startsWith(`${p}/`))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  let setBypassCookie = false;

  // ── Maintenance mode gate ──
  if (MAINTENANCE_MODE && !isMaintenanceExempt(pathname)) {
    const bypassParam = searchParams.get('bypass');
    const cookieVal = req.cookies.get(BYPASS_COOKIE)?.value;
    const bypassed =
      (BYPASS_SECRET && bypassParam === BYPASS_SECRET) ||
      (BYPASS_SECRET && cookieVal === BYPASS_SECRET);

    if (!bypassed) {
      // Rewrite + 503, not redirect — see note above.
      const url = req.nextUrl.clone();
      url.pathname = '/coming-soon';
      url.search = '';
      const res = NextResponse.rewrite(url, { status: 503 });
      res.headers.set('Retry-After', '3600');
      res.headers.set('X-Robots-Tag', 'noindex');
      return res;
    }
    if (bypassParam === BYPASS_SECRET) setBypassCookie = true;
  }

  // ── Locale routing ──
  if (isLocaleExempt(pathname)) {
    const res = applyNoindexIfNeeded(pathname, NextResponse.next());
    if (setBypassCookie) {
      res.cookies.set(BYPASS_COOKIE, BYPASS_SECRET!, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/' });
    }
    return res;
  }

  const isArabic = pathname === '/ar' || pathname.startsWith('/ar/');
  const locale = isArabic ? 'ar' : 'en';
  const canonicalPath = isArabic
    ? (pathname === '/ar' ? '/' : pathname.slice(3))
    : pathname;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-pathname', canonicalPath);

  let res: NextResponse;
  if (isArabic) {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = canonicalPath;
    res = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  } else {
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }

  res = applyNoindexIfNeeded(canonicalPath, res);
  res.cookies.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: '/' });
  if (setBypassCookie) {
    res.cookies.set(BYPASS_COOKIE, BYPASS_SECRET!, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/' });
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};