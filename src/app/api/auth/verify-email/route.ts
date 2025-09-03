// Местоположение: src/app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email и токен обязательны' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем правильный уникальный идентификатор ---
    // Ищем токен по его уникальной комбинации: identifier (userId) + token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: user.id,
          token: token,
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Неверный или устаревший токен' },
        { status: 400 },
      );
    }

    // Обновляем пользователя, устанавливая дату подтверждения email
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем токен по его уникальной комбинации ---
    // Удаляем использованный токен, используя тот же самый правильный идентификатор
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: user.id,
          token: token,
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify Email API error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
