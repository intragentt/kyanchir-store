// Местоположение: src/app/api/bot/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addMinutes } from 'date-fns';
import prisma from '@/lib/prisma';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем нашу крипто-утилиту ---
import { encrypt } from '@/lib/encryption';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Шифруем данные и используем правильные поля ---
    const encryptedFirstName = firstName ? encrypt(firstName) : null;
    const encryptedPhone = encrypt(phone);

    const user = await prisma.user.upsert({
      where: { telegramId: String(telegramId) },
      update: {
        phone: encryptedPhone, // Обновляем зашифрованный телефон
      },
      create: {
        telegramId: String(telegramId),
        phone: encryptedPhone, // Сохраняем зашифрованный телефон
        name_encrypted: encryptedFirstName, // Сохраняем зашифрованное имя
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
      data: {
        token,
        expires,
        userId: user.id,
      },
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
