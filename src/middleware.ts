// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_DOMAIN = 'admin.kyanchir.ru';
const MAIN_DOMAIN = 'kyanchir.ru';

export function middleware(req: NextRequest) {
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

  // --- ЛОГИКА МАРШРУТИЗАЦИИ НА ОСНОВЕ "REWRITE" ---

  // Сценарий 1: Пользователь зашел на АДМИНСКИЙ домен (admin.kyanchir.ru)
  if (hostname === ADMIN_DOMAIN) {
    // Мы "переписываем" запрос, чтобы Next.js искал страницы в папке /app/admin.
    // URL в браузере остается красивым (например, admin.kyanchir.ru/dashboard),
    // а Next.js "под капотом" рендерит страницу /app/admin/dashboard.
    // Никаких редиректов, никаких потерь сессии.
    return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
  }

  // Сценарий 2: Пользователь зашел на ОСНОВНОЙ домен (kyanchir.ru)
  if (hostname === MAIN_DOMAIN) {
    // Если он пытается зайти в /admin на основном домене, это запрещенный путь.
    // Мы не перенаправляем его, а просто показываем 404.
    // Защиту от не-админов теперь выполняет /app/admin/layout.tsx.
    if (pathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
