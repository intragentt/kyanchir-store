// Местоположение: src/app/api/auth/check-user/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем нашу утилиту хэширования

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем хэш для поиска ---
    // 1. Создаем хэш из полученного email.
    const emailHash = createHash(email);

    // 2. Ищем пользователя по полю email_hash.
    const user = await prisma.user.findUnique({
      where: { email_hash: emailHash },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
