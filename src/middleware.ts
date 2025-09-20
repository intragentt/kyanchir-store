// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_DOMAIN = 'admin.kyanchir.ru';
const MAIN_DOMAIN = 'kyanchir.ru';
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { hostname, pathname } = url;

  // Игнорируем служебные файлы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Получаем токен ОДИН РАЗ
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isUserAdmin =
    token && ADMIN_ROLES.includes((token.role as { name: string })?.name);

  // --- Сценарий 1: Пользователь зашел на АДМИНСКИЙ домен ---
  if (hostname === ADMIN_DOMAIN) {
    // Если он НЕ админ (включая гостей), отправляем его на страницу входа.
    if (!isUserAdmin) {
      const loginUrl = new URL('/login', `https://${MAIN_DOMAIN}`);
      loginUrl.searchParams.set('callbackUrl', url.href);
      return NextResponse.redirect(loginUrl);
    }
    // Если он АДМИН, "переписываем" URL, чтобы он видел контент из папки /admin.
    // Пример: admin.kyanchir.ru/dashboard -> /app/admin/dashboard
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- Сценарий 2: Пользователь зашел на ОСНОВНОЙ домен ---
  if (hostname === MAIN_DOMAIN) {
    // Если он пытается зайти в /admin, это запрещено на основном домене.
    if (pathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', req.url));
    }

    // Если он пытается зайти в профиль и не залогинен, отправляем на логин.
    if (pathname.startsWith('/profile') && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
