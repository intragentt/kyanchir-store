// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const GUEST_PATHS = ['/login', '/register'];
const PROTECTED_PATHS = ['/profile', '/admin'];
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем универсальное имя переменной AUTH_SECRET ---
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const isAuthenticated = !!token;
  const userRole = (token?.role as { name: string } | undefined)?.name;

  console.log('--- [MIDDLEWARE DEBUG] ---');
  console.log('Path:', pathname);
  console.log('Authenticated:', isAuthenticated);
  console.log('User Role:', userRole);

  if (GUEST_PATHS.some((path) => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/profile', req.url));
    }
    return NextResponse.next();
  }

  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(userRole!)) {
      console.log(
        `ACCESS DENIED for role "${userRole}" to path "${pathname}". Rewriting to 404.`,
      );
      const url = new URL('/404', req.url);
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/profile/:path*', '/admin/:path*'],
};
