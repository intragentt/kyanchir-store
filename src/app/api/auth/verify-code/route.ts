// Местоположение: /src/app/api/auth/verify-code/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    // 1. Проверяем сессию, чтобы знать, КАКОГО пользователя мы верифицируем
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    // 2. Получаем токен из тела запроса
    const { token } = await req.json();
    if (!token || typeof token !== 'string' || token.length !== 6) {
      return NextResponse.json(
        { error: 'Неверный формат кода.' },
        { status: 400 },
      );
    }

    // 3. Находим пользователя и дешифруем его email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user || !user.email_encrypted) {
      return NextResponse.json(
        { error: 'Пользователь не найден.' },
        { status: 404 },
      );
    }
    const email = decrypt(user.email_encrypted);

    // 4. Ищем токен в базе данных
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: token,
      },
    });

    // 5. Проверяем, что токен существует и не истек
    if (!verificationToken) {
      return NextResponse.json({ error: 'Неверный код.' }, { status: 400 });
    }
    if (new Date(verificationToken.expires) < new Date()) {
      return NextResponse.json(
        { error: 'Срок действия кода истек.' },
        { status: 400 },
      );
    }

    // 6. УСПЕХ! Обновляем пользователя и удаляем токен
    await prisma.user.update({
      where: { id: session.user.id },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          // Используем уникальный идентификатор @@unique
          identifier: email,
          token: token,
        },
      },
    });

    return NextResponse.json({ success: 'Email успешно подтвержден!' });
  } catch (error) {
    console.error('[VERIFY_CODE_ERROR]', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера.' },
      { status: 500 },
    );
  }
}
