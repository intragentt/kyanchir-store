// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью переработанный middleware ---

// 1. Список "гостевых" страниц, доступных всем
const GUEST_PATHS = ['/login', '/register'];
// 2. Список страниц, требующих авторизации
const PROTECTED_PATHS = ['/profile', '/admin'];
// 3. Список ролей, которым разрешен доступ в админку
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Пропускаем системные запросы Next.js
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Получаем токен пользователя (если он есть)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined; // Prisma возвращает роль как string

  console.log('--- [MIDDLEWARE DEBUG] ---');
  console.log('Path:', pathname);
  console.log('Authenticated:', isAuthenticated);
  console.log('User Role:', userRole);

  // 3. Логика для гостевых страниц
  if (GUEST_PATHS.some((path) => pathname.startsWith(path))) {
    // Если пользователь уже авторизован и пытается зайти на /login,
    // перенаправляем его в профиль
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/profile', req.url));
    }
    // В остальных случаях - пропускаем гостя
    return NextResponse.next();
  }

  // 4. Логика для защищенных страниц
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    // Если пользователь НЕ авторизован, отправляем его на страницу входа
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Если пользователь пытается зайти в админку, но у него нет нужной роли
    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(userRole!)) {
      console.log(`ACCESS DENIED for role "${userRole}" to path "${pathname}"`);
      // Перенаправляем на главную страницу
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 5. Для всех остальных случаев - просто пропускаем
  return NextResponse.next();
}

// Конфигурация matcher теперь должна включать все пути,
// которые мы хотим проверять.
export const config = {
  matcher: ['/login', '/register', '/profile/:path*', '/admin/:path*'],
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---```
