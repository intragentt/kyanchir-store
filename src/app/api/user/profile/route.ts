// Местоположение: src/app/api/user/profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Обработчик для PATCH запросов (частичное обновление)
export async function PATCH(req: Request) {
  try {
    // 1. Проверяем сессию, чтобы убедиться, что пользователь авторизован.
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body; // Пока обрабатываем только имя

    // 2. Валидация входных данных.
    if (!name) {
      return NextResponse.json(
        { error: 'Имя не может быть пустым' },
        { status: 400 },
      );
    }
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Имя должно содержать минимум 2 символа' },
        { status: 400 },
      );
    }

    // 3. Обновляем пользователя в базе данных.
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name,
      },
    });

    // 4. Возвращаем успешный ответ с обновленными данными (без хэша пароля).
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('API /user/profile PATCH error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
