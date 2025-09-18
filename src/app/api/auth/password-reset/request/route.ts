// Местоположение: /src/app/api/auth/password-reset/request/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email }: { email?: string } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const lowercasedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: lowercasedEmail },
    });

    // ВАЖНО: В целях безопасности, мы всегда возвращаем успешный ответ,
    // даже если пользователь не найден. Это предотвращает "перечисление email".
    if (!user) {
      console.log(
        `[Reset Request] Запрос на сброс для несуществующего email: ${email}`,
      );
      return NextResponse.json({
        success: true,
        message: 'Если аккаунт существует, ссылка для сброса была отправлена.',
      });
    }

    // 1. Создаем безопасный, уникальный токен
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 час

    // 2. Сохраняем токен в "сейф" (базу данных)
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: lowercasedEmail,
        token,
        expires,
      },
    });

    // 3. Отправляем письмо с помощью нашего "почтальона"
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