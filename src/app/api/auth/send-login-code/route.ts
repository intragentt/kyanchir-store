// Местоположение: /src/app/api/auth/send-login-code/route.ts
// НОВЫЙ ФАЙЛ, отвечающий ТОЛЬКО за отправку кода на email для входа.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendVerificationCodeEmail } from '@/lib/mail';
import { createHash, encrypt } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const lowercasedEmail = email.toLowerCase();
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 минут

    // 1. Проверяем, существует ли пользователь с таким email.
    const emailHash = createHash(lowercasedEmail);
    const user = await prisma.user.findUnique({
      where: { email_hash: emailHash },
    });

    // 2. Если пользователя нет - ОТКАЗЫВАЕМ. Регистрация - отдельный процесс.
    // Это предотвращает создание "пустых" аккаунтов.
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь с таким email не найден.' },
        { status: 404 },
      );
    }

    // 3. Удаляем старые токены для этого email
    await prisma.verificationToken.deleteMany({
      where: { identifier: lowercasedEmail },
    });

    // 4. Создаем новый токен
    await prisma.verificationToken.create({
      data: {
        identifier: lowercasedEmail,
        token: code,
        expires,
      },
    });

    // 5. Отправляем email с кодом
    await sendVerificationCodeEmail(lowercasedEmail, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SEND_LOGIN_CODE_ERROR]', error);
    return NextResponse.json(
      { error: 'Не удалось отправить код.' },
      { status: 500 },
    );
  }
}
