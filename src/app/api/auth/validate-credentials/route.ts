// Местоположение: src/app/api/auth/validate-credentials/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { createHash } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем нашу утилиту хэширования

export async function POST(req: Request) {
  try {
    const { email, password }: { email?: string; password?: string } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем хэш для поиска ---
    const emailHash = createHash(email.toLowerCase());

    const user = await prisma.user.findUnique({
      where: { email_hash: emailHash },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Validate credentials error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
