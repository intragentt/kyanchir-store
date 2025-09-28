// Местоположение: /src/app/api/auth/send-verification-code/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ ДЛЯ ВЕРИФИКАЦИИ В ПРОФИЛЕ

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth'; // Используем сессию для идентификации
import { sendVerificationCodeEmail } from '@/lib/mail'; // Используем наш Nodemailer
import { decrypt } from '@/lib/encryption'; // Используем дешифровку

export async function POST(req: Request) {
  try {
    // 1. Проверяем сессию: код может запросить только авторизованный пользователь
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    // 2. Находим пользователя в БД по ID из сессии
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // 3. Убеждаемся, что у пользователя есть зашифрованный email
    if (!user || !user.email_encrypted) {
      return NextResponse.json(
        { error: 'Пользователь или Email не найден' },
        { status: 404 },
      );
    }

    // 4. Генерируем новый, надежный 6-значный код
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 минут

    // 5. Дешифруем email, чтобы знать, куда отправлять письмо
    const email = decrypt(user.email_encrypted);

    // 6. Удаляем старые токены для этого email, чтобы избежать путаницы
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 7. Создаем новый токен верификации в базе данных
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires,
      },
    });

    // 8. Отправляем email с кодом, используя нашу централизованную функцию
    await sendVerificationCodeEmail(email, code);

    return NextResponse.json({
      success: 'Код подтверждения успешно отправлен.',
    });
  } catch (error) {
    console.error('[SEND_VERIFICATION_CODE_ERROR]', error);
    return NextResponse.json(
      { error: 'Не удалось отправить код.' },
      { status: 500 },
    );
  }
}
