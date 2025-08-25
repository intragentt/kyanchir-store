// Местоположение: src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'], // Защищаем эти маршруты
};

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get('session')?.value;

  if (!sessionCookie) {
    // Если cookie нет, отправляем на страницу входа
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Проверяем, действителен ли "пропуск" в cookie
    const sessionPayload = await decrypt(sessionCookie);

    if (!sessionPayload) {
      // Если "пропуск" поддельный или истек, тоже отправляем на вход
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    // В случае ошибки расшифровки (например, неверный ключ)
    console.error('Middleware decryption error:', error);
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Если все в порядке, разрешаем доступ к странице
  return NextResponse.next();
}
