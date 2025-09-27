// Местоположение: /src/app/api/auth/password-reset/request/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';
import { createHash } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем нашу утилиту хэширования

export async function POST(req: Request) {
  try {
    const { email }: { email?: string } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const lowercasedEmail = email.toLowerCase();

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем хэш для поиска ---
    const emailHash = createHash(lowercasedEmail);

    const user = await prisma.user.findUnique({
      where: { email_hash: emailHash },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    if (!user) {
      console.log(
        `[Reset Request] Запрос на сброс для несуществующего email: ${email}`,
      );
      return NextResponse.json({
        success: true,
        message: 'Если аккаунт существует, ссылка для сброса была отправлена.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 час

    // Важно: в токен мы по-прежнему сохраняем НАСТОЯЩИЙ email,
    // чтобы его можно было использовать для отправки письма.
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: lowercasedEmail,
        token,
        expires,
      },
    });

    await sendPasswordResetEmail(lowercasedEmail, token);

    return NextResponse.json({
      success: true,
      message: 'Если аккаунт существует, ссылка для сброса была отправлена.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
