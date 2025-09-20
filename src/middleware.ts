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

  // --- Сценарий 1: Пользователь на АДМИНСКОМ домене ---
  if (hostname === ADMIN_DOMAIN) {
    // Если он НЕ админ, безусловно отправляем его на страницу входа.
    if (!isUserAdmin) {
      const loginUrl = new URL('/login', `https://${MAIN_DOMAIN}`);
      loginUrl.searchParams.set('callbackUrl', url.href);
      return NextResponse.redirect(loginUrl);
    }
    // Если он АДМИН, "переписываем" URL, чтобы он видел контент из папки /admin.
    // ЭТО КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Мы больше НЕ добавляем /admin к пути.
    // Мы говорим системе: "Покажи этому пользователю контент из /app/admin,
    // используя тот путь, который он запросил".
    // admin.kyanchir.ru/dashboard -> /app/admin/dashboard
    // admin.kyanchir.ru/users -> /app/admin/users
    return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
  }

  // --- Сценарий 2: Пользователь на ОСНОВНОМ домене ---
  if (hostname === MAIN_DOMAIN) {
    // Если он пытается зайти в /admin, это запрещено.
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
