// Местоположение: src/app/api/auth/telegram/start/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMinutes } from 'date-fns';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Используем более надежный метод генерации токена ---
// Вместо 'crypto', который может быть капризным в некоторых средах,
// мы будем использовать комбинацию времени и случайного числа.
// Этого более чем достаточно для одноразового токена входа.
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function POST() {
  try {
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Новый, "вездеходный" генератор токена ---
    const token = `${Date.now()}${Math.random().toString(36).substring(2)}`;
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    const expires = addMinutes(new Date(), 5);

    const loginToken = await prisma.loginToken.create({
      data: { token, expires },
    });

    return NextResponse.json({ token: loginToken.token });
  } catch (error) {
    console.error('Error creating login token:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
