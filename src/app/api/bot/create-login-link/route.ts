// Местоположение: src/app/api/bot/create-login-link/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addMinutes } from 'date-fns';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.BOT_API_SECRET;

    // --- НАЧАЛО ДИАГНОСТИКИ ---
    console.log('--- НАЧАЛО АУДИТА БЕЗОПАСНОСТИ ---');

    if (authHeader) {
      console.log(
        `Получен заголовок 'Authorization'. Длина: ${authHeader.length}`,
      );
      console.log(`Первые 15 символов: '${authHeader.substring(0, 15)}'`);
      console.log(
        `Последние 15 символов: '${authHeader.substring(
          authHeader.length - 15,
        )}'`,
      );
    } else {
      console.log("!!! ОШИБКА: Заголовок 'Authorization' НЕ ПОЛУЧЕН.");
    }

    if (secret) {
      console.log(
        `Секрет 'BOT_API_SECRET' на сервере. Длина: ${secret.length}`,
      );
      console.log(`Первые 15 символов: '${secret.substring(0, 15)}'`);
      console.log(
        `Последние 15 символов: '${secret.substring(secret.length - 15)}'`,
      );
    } else {
      console.log(
        "!!! КРИТИЧЕСКАЯ ОШИБКА: Секрет 'BOT_API_SECRET' НЕ НАЙДЕН на сервере.",
      );
    }

    const expectedAuthHeader = `Bearer ${secret}`;
    console.log(`Ожидался заголовок. Длина: ${expectedAuthHeader.length}`);

    if (authHeader === expectedAuthHeader) {
      console.log('--- ВЕРДИКТ: УСПЕХ! Ключи полностью совпадают. ---');
    } else {
      console.log('--- ВЕРДИКТ: ПРОВАЛ! Ключи НЕ СОВПАДАЮТ. ---');
    }

    console.log('--- КОНЕЦ АУДИТА БЕЗОПАСНОСТИ ---');
    // --- КОНЕЦ ДИАГНОСТИКИ ---

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { telegramId, firstName, phone } = await request.json();

    if (!telegramId || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const user = await prisma.user.upsert({
      where: { telegramId: String(telegramId) },
      update: { phone, name: firstName },
      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      create: {
        telegramId: String(telegramId),
        phone,
        name: firstName,
        role: {
          connect: {
            name: 'USER', // <-- ВОТ ИСПРАВЛЕНИЕ. Подключаемся к существующей роли 'USER'
          },
        },
      },
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = addMinutes(new Date(), 5);

    await prisma.loginToken.create({
      data: { token, expires, userId: user.id },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[Bot API] Error creating login link:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
