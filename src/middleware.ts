// Местоположение: src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/admin/dashboard']; // Список страниц, которые защищаем
const AUTH_ROUTES = ['/admin/login']; // Страницы для входа

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Получаем "пропуск" из cookie. Мы его скоро туда положим.
  const sessionToken = request.cookies.get('auth_session')?.value;

  // Если пользователь пытается зайти на защищенную страницу БЕЗ пропуска
  if (PROTECTED_ROUTES.includes(pathname) && !sessionToken) {
    // Отправляем его на страницу входа
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // Если пользователь УЖЕ с пропуском пытается зайти на страницу входа
  if (AUTH_ROUTES.includes(pathname) && sessionToken) {
    // Отправляем его сразу в админку, незачем ему снова логиниться
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  // Во всех остальных случаях просто показываем страницу, которую он запросил
  return NextResponse.next();
}

// Конфиг, который говорит, на каких путях должен работать наш "охранник"
export const config = {
  matcher: ['/admin/:path*'],
};
