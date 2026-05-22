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

const staticPaths = [
  '/_next',
  '/api/auth',
  '/favicon.ico',
  '/manifest.json',
];

const isPublicPath = (pathname: string) => {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));
};

const isStaticPath = (pathname: string) => {
  return staticPaths.some((path) => pathname.startsWith(path)) || pathname.includes('.');
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and public paths
  if (isStaticPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get locale from cookie or accept-language header
  const locale = request.cookies.get('NEXT_LOCALE')?.value ||
    (request.headers.get('accept-language')?.includes('ar') ? 'ar' : 'en');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Add locale and user headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  response.headers.set('x-direction', direction);
  response.headers.set('x-user-id', token.id as string || '');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.).*)',
  ],
};
