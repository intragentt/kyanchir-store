// Местоположение: src/app/api/auth/create-login-token/route.ts (НОВЫЙ ФАЙЛ)
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { addMinutes } from 'date-fns';

// Эта функция - наша "Касса", выдающая уникальные билеты.
export async function GET() {
  try {
    // 1. Генерируем криптографически случайный, безопасный номер для "билета".
    const token = crypto.randomBytes(32).toString('hex');

    // 2. Устанавливаем срок годности билета - 5 минут.
    const expires = addMinutes(new Date(), 5);

    // 3. Сохраняем "билет" в нашей базе данных.
    const loginToken = await prisma.loginToken.create({
      data: {
        token,
        expires,
      },
    });

    // 4. Отдаем номер "билета" нашему фронтенду.
    return NextResponse.json({ token: loginToken.token });
  } catch (error) {
    console.error('Error creating login token:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
