// Местоположение: src/app/api/bot/create-login-link/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addMinutes } from 'date-fns';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.BOT_API_SECRET;

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

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем правильные имена полей из вашей схемы ---
    // Шифруем данные перед записью в базу данных
    const encryptedFirstName = firstName ? encrypt(firstName) : null;
    const encryptedPhone = encrypt(phone);

    const user = await prisma.user.upsert({
      where: { telegramId: String(telegramId) },
      update: {
        // При обновлении, обновляем зашифрованный телефон в поле 'phone'
        phone: encryptedPhone,
      },
      create: {
        telegramId: String(telegramId),
        // При создании, записываем зашифрованные данные в правильные поля:
        phone: encryptedPhone, // <-- ИСПРАВЛЕНО
        name_encrypted: encryptedFirstName, // <-- Это поле у вас есть
        role: {
          connect: {
            name: 'USER',
          },
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
