// Местоположение: src/app/api/auth/verify-code/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/session';

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 },
      );
    }

    // --- НАЧАЛО ИСПРАВЛЕНИЙ ---
    // Ищем токен по его уникальному значению. Он должен быть один.
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    // Если токен вообще не найден
    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Неверный код.', attemptsLeft: 0 },
        { status: 401 },
      );
    }

    // Если токен найден, но он для другого email или просрочен
    if (
      verificationToken.identifier !== email ||
      verificationToken.expires < new Date()
    ) {
      return NextResponse.json(
        {
          error: 'Код устарел или недействителен. Запросите новый.',
          attemptsLeft: 0,
        },
        { status: 401 },
      );
    }

    // Если попытки исчерпаны
    if (verificationToken.attempts >= MAX_ATTEMPTS) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        {
          error: 'Превышено количество попыток. Запросите новый код.',
          attemptsLeft: 0,
        },
        { status: 401 },
      );
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЙ ---

    // --- УСПЕШНАЯ ВЕРИФИКАЦИЯ ---
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Такого быть не должно, т.к. next-auth создает юзера при отправке письма, но проверим
      return NextResponse.json(
        { error: 'Пользователь не найден.' },
        { status: 404 },
      );
    }

    // Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: { token: verificationToken.token },
    });

    // Создаем долгосрочную сессию
    const sessionPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
    };
    const session = await encrypt(sessionPayload);

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера.' },
      { status: 500 },
    );
  }
}
