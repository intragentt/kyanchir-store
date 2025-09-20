// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Константы для доменов и ролей для чистоты кода
const ADMIN_DOMAIN = 'admin.kyanchir.ru';
const MAIN_DOMAIN = 'kyanchir.ru';
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host')!;

  // 1. Игнорируем служебные запросы, чтобы не тратить ресурсы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Устанавливаем личность пользователя ОДИН РАЗ в самом начале
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = !!token;
  const userRole = (token?.role as { name: string } | undefined)?.name;
  const isUserAdmin = isAuthenticated && ADMIN_ROLES.includes(userRole!);

  // --- НАЧАЛО НОВОЙ АРХИТЕКТУРЫ ---

  // 3. Логика для АДМИНСКОГО СУБДОМЕНА
  if (hostname === ADMIN_DOMAIN) {
    // Если пользователь - админ и находится на админском пути, всё в порядке.
    if (isUserAdmin && pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    // Во всех остальных случаях (не админ, или пытается открыть не /admin/*),
    // принудительно отправляем его на основной сайт. Админка - только для админов.
    return NextResponse.redirect(new URL(pathname, `https://${MAIN_DOMAIN}`));
  }

  // 4. Логика для ОСНОВНОГО ДОМЕНА
  if (hostname === MAIN_DOMAIN) {
    // Если кто-то пытается зайти в /admin на основном домене...
    if (pathname.startsWith('/admin')) {
      // ...и он админ, перенаправляем его на правильный субдомен.
      if (isUserAdmin) {
        return NextResponse.redirect(
          new URL(pathname, `https://${ADMIN_DOMAIN}`),
        );
      }
      // ...а если не админ (или не залогинен), показываем 404, скрывая сам факт существования админки.
      return NextResponse.rewrite(new URL('/404', req.url));
    }

    // Если пользователь пытается зайти на защищенный путь (кроме админки)...
    if (pathname.startsWith('/profile') && !isAuthenticated) {
      // ...и он не залогинен, отправляем на страницу входа.
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 5. Если ни одно из правил не сработало, пропускаем запрос дальше.
  return NextResponse.next();
}

export const config = {
  // Middleware должен проверять все запросы, чтобы быть эффективным диспетчером
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};