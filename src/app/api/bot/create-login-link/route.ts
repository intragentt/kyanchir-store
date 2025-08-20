// Местоположение: src/app/api/bot/create-login-link/route.ts (НОВЫЙ ФАЙЛ)
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addMinutes } from 'date-fns';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 1. Проверяем "пароль" от нашего Эмиссара
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.BOT_API_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Получаем данные о пользователе от Эмиссара
    const { telegramId, firstName, phone } = await request.json();
    if (!telegramId || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // 3. Находим или создаем пользователя в нашей базе
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { phone, name: firstName },
      create: { telegramId, phone, name: firstName },
    });

    // 4. Создаем для него одноразовый "пропуск"
    const token = crypto.randomBytes(32).toString('hex');
    const expires = addMinutes(new Date(), 5);

    await prisma.loginToken.create({
      data: {
        token,
        expires,
        userId: user.id, // Сразу привязываем к пользователю!
      },
    });

    // 5. Отправляем "пропуск" обратно Эмиссару
    return NextResponse.json({ token });
  } catch (error) {
    console.error('[Bot API] Error creating login link:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
