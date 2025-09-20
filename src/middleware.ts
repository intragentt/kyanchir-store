// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_DOMAIN = 'admin.kyanchir.ru';
const MAIN_DOMAIN = 'kyanchir.ru';
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host')!;

  // Игнорируем служебные запросы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- ШАГ 1: МАРШРУТИЗАЦИЯ ДОМЕНОВ ---
  // Эта логика гарантирует, что пользователь всегда находится на правильном домене.

  // Если запрос к /admin пришел на ОСНОВНОЙ домен...
  if (hostname === MAIN_DOMAIN && pathname.startsWith('/admin')) {
    // ...немедленно перенаправляем его на АДМИНСКИЙ домен.
    return NextResponse.redirect(new URL(pathname, `https://${ADMIN_DOMAIN}`));
  }

  // Если запрос к НЕ-/admin страницам пришел на АДМИНСКИЙ домен...
  if (hostname === ADMIN_DOMAIN && !pathname.startsWith('/admin')) {
    // ...немедленно возвращаем его на ОСНОВНОЙ домен.
    return NextResponse.redirect(new URL(pathname, `https://${MAIN_DOMAIN}`));
  }

  // --- ШАГ 2: ПРОВЕРКА ДОСТУПА ---
  // Этот код выполнится ТОЛЬКО если пользователь уже на правильном домене.

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = !!token;
  const userRole = (token?.role as { name: string } | undefined)?.name;
  const isUserAdmin = isAuthenticated && ADMIN_ROLES.includes(userRole!);

  // Если мы на админском домене (а мы знаем, что путь начинается с /admin)...
  if (hostname === ADMIN_DOMAIN) {
    // ...и у пользователя нет прав админа (включая случай, когда он не залогинен)...
    if (!isUserAdmin) {
      // ...отправляем его на страницу входа на ОСНОВНОМ домене.
      return NextResponse.redirect(new URL('/login', `https://${MAIN_DOMAIN}`));
    }
  }

  // Если мы на основном домене и путь защищен...
  if (hostname === MAIN_DOMAIN && pathname.startsWith('/profile')) {
    // ...а пользователь не залогинен...
    if (!isAuthenticated) {
      // ...отправляем его на страницу входа.
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Если все проверки пройдены, разрешаем доступ.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
