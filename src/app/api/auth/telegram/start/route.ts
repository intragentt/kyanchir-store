// Местоположение: src/app/api/auth/telegram/start/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import { randomBytes } from 'crypto';

export async function POST() {
  try {
    // Генерируем уникальный, криптографически безопасный номер "билета".
    const token = randomBytes(32).toString('hex');
    // "Билет" будет действителен 5 минут.
    const expires = addMinutes(new Date(), 5);

    // Сохраняем "билет" в нашей "кассе".
    const loginToken = await prisma.loginToken.create({
      data: { token, expires },
    });

    // Возвращаем номер "билета" клиенту.
    return NextResponse.json({ token: loginToken.token });
  } catch (error) {
    console.error('Error creating login token:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
