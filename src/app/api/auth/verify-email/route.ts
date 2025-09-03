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

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Ищем пользователя по email, чтобы получить его ID ---
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    // Теперь ищем токен, используя правильный идентификатор - ID пользователя
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: user.id, // Ищем по userId
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

    // Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: user.id, // Удаляем по той же уникальной комбинации
          token: token,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify Email API error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
