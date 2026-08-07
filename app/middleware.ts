import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET;
const BYPASS_COOKIE = 'maintenance_bypass';

function isMaintenanceExempt(pathname: string) {
  return (
    pathname.startsWith('/coming-soon') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images')
  );
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

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

    if (bypassParam === BYPASS_SECRET) {
      const res = NextResponse.next();
      res.cookies.set(BYPASS_COOKIE, BYPASS_SECRET!, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};