import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET;
const BYPASS_COOKIE = 'maintenance_bypass';
const LOCALE_COOKIE = 'NEXT_LOCALE';

function isMaintenanceExempt(pathname: string) {
  return (
    pathname.startsWith('/coming-soon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images')
  );
}

// Admin stays English-only — no /ar/admin variant, and it's already
// excluded from the sitemap/robots.ts, so it doesn't need hreflang either.
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

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  let setBypassCookie = false;

  // ── Maintenance mode gate (same behavior as before) ──
  if (MAINTENANCE_MODE && !isMaintenanceExempt(pathname)) {
    const bypassParam = searchParams.get('bypass');
    const cookieVal = req.cookies.get(BYPASS_COOKIE)?.value;
    const bypassed =
      (BYPASS_SECRET && bypassParam === BYPASS_SECRET) ||
      (BYPASS_SECRET && cookieVal === BYPASS_SECRET);

    if (!bypassed) {
      const url = req.nextUrl.clone();
      url.pathname = '/coming-soon';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (bypassParam === BYPASS_SECRET) setBypassCookie = true;
  }

  // ── Locale routing ──
  if (isLocaleExempt(pathname)) {
    const res = NextResponse.next();
    if (setBypassCookie) {
      res.cookies.set(BYPASS_COOKIE, BYPASS_SECRET!, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }
    return res;
  }

  const isArabic = pathname === '/ar' || pathname.startsWith('/ar/');
  const locale = isArabic ? 'ar' : 'en';

  // '/ar' → '/', '/ar/shop' → '/shop'. This is what actually gets
  // rendered — same route file, no app/ar/ duplication.
  const canonicalPath = isArabic
    ? pathname === '/ar' ? '/' : pathname.slice(3)
    : pathname;

  // Forwarded to Server Components so layout.tsx can read the resolved
  // locale + canonical path without re-deriving them from the URL.
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

  res.cookies.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: '/' });
  if (setBypassCookie) {
    res.cookies.set(BYPASS_COOKIE, BYPASS_SECRET!, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};