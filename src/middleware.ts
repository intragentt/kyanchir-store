// Местоположение: src/middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  // `withAuth` обогащает `req` объектом `req.nextauth.token`.
  function middleware(req) {
    // Эта функция будет выполняться только для АВТОРИЗОВАННЫХ пользователей
    // на страницах, указанных в `matcher`.

    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // --- НАША ЛОГИКА ДОСТУПА ---
    // Если пользователь залогинен, но не админ/менеджер, и пытается
    // зайти в админку, перенаправляем его.
    if (
      pathname.startsWith('/admin') &&
      token?.role !== 'ADMIN' &&
      token?.role !== 'MANAGEMENT'
    ) {
      // Можно редиректить на главную или на страницу с ошибкой "Доступ запрещен"
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Для всех остальных авторизованных пользователей просто пропускаем дальше.
    return NextResponse.next();
  },
  {
    // --- НАСТРОЙКИ withAuth ---
    callbacks: {
      // Этот коллбэк определяет, "авторизован" ли пользователь в принципе.
      // Если он вернет `true`, выполнится функция middleware выше.
      // Если `false`, пользователя перенаправит на страницу логина.
      authorized: ({ token }) => !!token,
    },

    // Указываем, где наша кастомная страница логина,
    // чтобы middleware знал, куда редиректить неавторизованных.
    pages: {
      signIn: '/login',
    },
  },
);

// Конфигурация matcher остается прежней.
// ВАЖНО: Мы НЕ добавляем сюда /api/admin/*,
// так как защиту API мы делаем ВНУТРИ самого API-эндпоинта, а не здесь.
export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
