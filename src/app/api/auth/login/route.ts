// Местоположение: src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const ADMIN_EMAIL = 'admin@kyanchir.com';
    const ADMIN_PASSWORD = 'supersecretpassword';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Успех! Создаем ответ и "вкладываем" в него cookie
      const response = NextResponse.json({ success: true });

      response.cookies.set('auth_session', 'your_secret_token', {
        httpOnly: true, // Куки нельзя прочитать из JavaScript на клиенте
        secure: process.env.NODE_ENV === 'production', // Передавать только по HTTPS
        maxAge: 60 * 60 * 24, // Срок жизни - 1 день
        path: '/', // Доступен на всем сайте
      });

      return response;
    } else {
      // Неверные данные
      return NextResponse.json(
        { message: 'Неверный логин или пароль.' },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера.' },
      { status: 500 },
    );
  }
}
