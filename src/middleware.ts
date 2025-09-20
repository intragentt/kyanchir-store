// Местоположение: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Упрощаем списки путей ---
const PROTECTED_PATHS = ['/profile', '/admin'];
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Игнорируем служебные маршруты и файлы
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = !!token;
  const userRole = (token?.role as { name: string } | undefined)?.name;

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Удалена логика для GUEST_PATHS, так как matcher её больше не включает ---
  // Логика middleware теперь едина и проста: если путь защищен, проверяем доступ.
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      // Если пользователь не аутентифицирован, отправляем его на страницу входа.
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Если пользователь пытается зайти в админку, проверяем его роль.
    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(userRole!)) {
      // Если роль не подходит, показываем страницу 404, чтобы скрыть существование админки.
      const url = new URL('/404', req.url);
      return NextResponse.rewrite(url);
    }
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // Для всех остальных случаев (например, главная страница, каталог) просто пропускаем.
  return NextResponse.next();
}

export const config = {
  // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Middleware запускается ТОЛЬКО для защищенных маршрутов.
  // Мы убрали '/login' и '/register', чтобы разорвать петлю редиректов.
  matcher: ['/profile/:path*', '/admin/:path*'],
};
