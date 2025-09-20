// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// --- КОНСТАНТЫ ---
const ADMIN_DOMAIN = 'admin.kyanchir.ru';
const MAIN_DOMAIN = 'kyanchir.ru';
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

export async function middleware(req: NextRequest) {
  // Используем канонический способ получения URL и hostname
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

  // --- ШАГ 1: ОПРЕДЕЛЕНИЕ ЛИЧНОСТИ ---
  // Получаем токен. Это единственный источник правды о пользователе.
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isUserAdmin =
    token && ADMIN_ROLES.includes((token.role as { name: string })?.name);

  // --- ШАГ 2: МАРШРУТИЗАЦИЯ И ЗАЩИТА ---
  // Логика построена от самого специфичного случая к самому общему.

  // Сценарий 1: Пользователь на АДМИНСКОМ домене.
  if (hostname === ADMIN_DOMAIN) {
    // Если он не админ, или пытается открыть что-то кроме админки — безусловный редирект на основной сайт.
    // Это правило защищает админский домен и исправляет неверные URL.
    if (!isUserAdmin || !pathname.startsWith('/admin')) {
      url.hostname = MAIN_DOMAIN;
      return NextResponse.redirect(url);
    }
    // Если он админ и находится в /admin, пропускаем его.
    return NextResponse.next();
  }

  // Сценарий 2: Пользователь на ОСНОВНОМ домене.
  if (hostname === MAIN_DOMAIN) {
    // Если он админ и пытается зайти в /admin...
    if (pathname.startsWith('/admin') && isUserAdmin) {
      // ...перенаправляем его на правильный домен.
      url.hostname = ADMIN_DOMAIN;
      return NextResponse.redirect(url);
    }
    // Если он не админ (или гость) и пытается зайти в /admin...
    if (pathname.startsWith('/admin') && !isUserAdmin) {
      // ...показываем 404.
      return NextResponse.rewrite(new URL('/404', req.url));
    }
    // Если он не залогинен и пытается зайти в профиль...
    if (pathname.startsWith('/profile') && !token) {
      // ...отправляем на логин.
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Если ни одно из правил не сработало, пользователь может пройти.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
