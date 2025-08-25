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

    // Ищем токен, который соответствует email и еще не истек
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: { gte: new Date() },
      },
    });

    // Если токен для этого email не найден или уже истек
    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Код устарел. Запросите новый.', attemptsLeft: 0 },
        { status: 401 },
      );
    }

    // Если код не совпадает
    if (verificationToken.token !== token) {
      const attempts = verificationToken.attempts + 1;
      await prisma.verificationToken.update({
        where: { token: verificationToken.token },
        data: { attempts },
      });

      const attemptsLeft = MAX_ATTEMPTS - attempts;
      if (attemptsLeft <= 0) {
        // Удаляем токен, если попытки исчерпаны
        await prisma.verificationToken.delete({
          where: { token: verificationToken.token },
        });
        return NextResponse.json(
          { error: 'Попытки исчерпаны. Запросите новый код.', attemptsLeft: 0 },
          { status: 401 },
        );
      }

      return NextResponse.json(
        {
          error: `Неверный код. Осталось попыток: ${attemptsLeft}`,
          attemptsLeft,
        },
        { status: 401 },
      );
    }

    // --- УСПЕШНАЯ ВЕРИФИКАЦИЯ ---

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден.' },
        { status: 404 },
      );
    }

    // Создаем долгосрочную сессию
    const sessionPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
    };
    const session = await encrypt(sessionPayload);

    // Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: { token: verificationToken.token },
    });

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
