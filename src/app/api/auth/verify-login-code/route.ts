// Местоположение: /src/app/api/auth/verify-login-code/route.ts
// НОВЫЙ ФАЙЛ, отвечающий за проверку кода и возврат данных пользователя для создания сессии.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (
      !email ||
      typeof email !== 'string' ||
      !token ||
      typeof token !== 'string' ||
      token.length !== 6
    ) {
      return NextResponse.json(
        { error: 'Неверный формат запроса.' },
        { status: 400 },
      );
    }

    const lowercasedEmail = email.toLowerCase();

    // 1. Ищем токен в базе данных
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: lowercasedEmail,
        token: token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Неверный код.' }, { status: 400 });
    }

    if (new Date(verificationToken.expires) < new Date()) {
      return NextResponse.json(
        { error: 'Срок действия кода истек.' },
        { status: 400 },
      );
    }

    // 2. Если токен валиден, находим пользователя по email
    const emailHash = createHash(lowercasedEmail);
    const user = await prisma.user.findUnique({
      where: { email_hash: emailHash },
    });

    if (!user) {
      // Этого никогда не должно произойти, так как мы проверяем email перед отправкой кода
      return NextResponse.json(
        { error: 'Пользователь не найден.' },
        { status: 404 },
      );
    }

    // 3. Успех! Обновляем пользователя и удаляем токен.
    // Помечаем email как верифицированный, если он еще не был.
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: user.emailVerified || new Date() },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: lowercasedEmail,
          token: token,
        },
      },
    });

    // 4. Возвращаем ПОЛНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ.
    // Это критически важно для того, чтобы `signIn` мог создать сессию.
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[VERIFY_LOGIN_CODE_ERROR]', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера.' },
      { status: 500 },
    );
  }
}
