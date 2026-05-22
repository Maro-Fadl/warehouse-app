import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/about',
  '/api/auth',
  '/api/webhooks',
];

const isPublicPath = (pathname: string) => {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Locale detection
  const acceptLanguage = request.headers.get('accept-language');
  const locale = acceptLanguage?.includes('ar') ? 'ar' : 'en';
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Add locale headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  response.headers.set('x-direction', direction);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
