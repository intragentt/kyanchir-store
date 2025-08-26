// Местоположение: src/app/api/auth/telegram/finalize/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Мы не можем напрямую создать сессию next-auth отсюда, это небезопасно.
// Вместо этого, мы создадим ОДНОРАЗОВЫЙ токен, который фронтенд обменяет на сессию.
import { randomBytes } from 'crypto';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID required' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // 1. Генерируем новый, безопасный, одноразовый токен
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // Токен живет 10 минут

    // 2. Сохраняем этот токен в базу, привязав к пользователю
    await prisma.loginToken.create({
      data: {
        userId,
        token,
        expires,
      },
    });

    // 3. Отправляем этот токен на фронтенд
    return NextResponse.json({ status: 'success', token });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  } catch (error) {
    console.error('Error finalizing login:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
