// Местоположение: src/app/api/auth/verify-email/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем нашу утилиту хэширования

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || !token || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email и токен обязательны' },
        { status: 400 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем хэш для поиска пользователя ---
    const emailHash = createHash(email);

    const user = await prisma.user.findUnique({
      where: { email_hash: emailHash },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    // ВАЖНО: В модели VerificationToken поле `identifier` теперь хранит `email`, а не `userId`.
    // Это изменение нужно будет внести в /send-verification-code/route.ts, если еще не сделано.
    // Пока что, предположим, что identifier - это email.
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email, // Ищем по email
          token: token,
        },
      },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Неверный или устаревший токен' },
        { status: 400 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем пользователя по хэшу ---
    await prisma.user.update({
      where: { email_hash: emailHash },
      data: { emailVerified: new Date() },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
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
