// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// --- КОНСТАНТЫ ---
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

  // --- Сценарий 1: Пользователь на ОСНОВНОМ домене ---
  if (hostname === MAIN_DOMAIN) {
    // Если он пытается получить доступ к /admin...
    if (pathname.startsWith('/admin')) {
      // ...и он админ...
      if (isUserAdmin) {
        // ...перенаправляем его на админский домен, УДАЛЯЯ /admin из пути.
        const newPath = pathname.replace('/admin', '') || '/';
        url.hostname = ADMIN_DOMAIN;
        url.pathname = newPath;
        return NextResponse.redirect(url);
      }
      // ...а если он НЕ админ (или гость), показываем 404, чтобы скрыть админку.
      return NextResponse.rewrite(new URL('/404', req.url));
    }

    // Если он пытается зайти в профиль и не залогинен, отправляем на логин.
    if (pathname.startsWith('/profile') && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // --- Сценарий 2: Пользователь на АДМИНСКОМ домене ---
  if (hostname === ADMIN_DOMAIN) {
    // Если он НЕ админ (включая гостей), безусловно отправляем его на страницу входа.
    // Админский домен - только для админов.
    if (!isUserAdmin) {
      const loginUrl = new URL('/login', `https://${MAIN_DOMAIN}`);
      // Сохраняем URL, на который он хотел попасть, для редиректа после логина
      loginUrl.searchParams.set('callbackUrl', url.href);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Если ни одно из правил не сработало, пропускаем.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
