// Местоположение: src/app/api/auth/verify-token/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 400 },
      );
    }

    // 1. Ищем токен в базе данных.
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    // 2. Проверяем, существует ли токен и не истек ли его срок.
    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или ее срок действия истек' },
        { status: 400 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // 3. Находим пользователя по ID, который мы теперь храним в `identifier`.
    const user = await prisma.user.findUnique({
      where: { id: verificationToken.identifier }, // <<< КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Связанный пользователь не найден' },
        { status: 404 },
      );
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    // 4. Обновляем пользователя, устанавливая флаг верификации.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    // 5. Удаляем использованный токен из базы данных.
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /verify-token error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
