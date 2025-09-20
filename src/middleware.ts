// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PATHS = ['/profile', '/admin'];
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host')!;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем точное сравнение доменов === ---
  const mainDomain = 'kyanchir.ru';
  const adminDomain = 'admin.kyanchir.ru';

  // Правило 1: Если кто-то зашел ТОЧНО на основной домен и пытается открыть /admin...
  if (hostname === mainDomain && pathname.startsWith('/admin')) {
    const newUrl = new URL(pathname, `https://${adminDomain}`);
    return NextResponse.redirect(newUrl);
  }

  // Правило 2: Если кто-то зашел ТОЧНО на админский субдомен, но пытается открыть что-то КРОМЕ /admin...
  if (hostname === adminDomain && !pathname.startsWith('/admin')) {
    const newUrl = new URL(pathname, `https://${mainDomain}`);
    return NextResponse.redirect(newUrl);
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = !!token;
  const userRole = (token?.role as { name: string } | undefined)?.name;

  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', `https://${mainDomain}`);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(userRole!)) {
      const notFoundUrl = new URL('/404', `https://${adminDomain}`);
      return NextResponse.rewrite(notFoundUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
