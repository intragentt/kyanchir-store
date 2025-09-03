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

    // --- НАЧАЛО ИЗМЕНЕНИЙ: "ЖУЧОК" ДЛЯ ОТЛАДКИ ---
    console.log('--- [MIDDLEWARE DEBUG] ---');
    console.log('Pathname:', pathname);
    console.log('Token received:', JSON.stringify(token, null, 2)); // Выводим токен в виде красивого JSON
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    // --- НАША ЛОГИКА ДОСТУПА ---
    // Если пользователь залогинен, но не админ/менеджер, и пытается
    // зайти в админку, перенаправляем его.
    if (
      pathname.startsWith('/admin') &&
      // --- ИЗМЕНЕНИЕ: Сравниваем свойство .name, а не весь объект ---
      token?.role?.name !== 'ADMIN' &&
      token?.role?.name !== 'MANAGEMENT'
      // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    ) {
      console.log(
        `>>> ACCESS DENIED for role "${token?.role?.name}". Redirecting to homepage.`,
      );
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Для всех остальных авторизованных пользователей просто пропускаем дальше.
    console.log(
      `>>> Access GRANTED for role "${token?.role?.name}". Continuing to ${pathname}.`,
    );
    return NextResponse.next();
  },
  {
    // --- НАСТРОЙКИ withAuth ---
    callbacks: {
      // Этот коллбэк определяет, "авторизован" ли пользователь в принципе.
      authorized: ({ token }) => !!token,
    },

    // Указываем, где наша кастомная страница логина,
    pages: {
      signIn: '/login',
    },
  },
);

// Конфигурация matcher остается прежней.
export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
