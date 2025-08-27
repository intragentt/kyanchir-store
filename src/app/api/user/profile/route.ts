// Местоположение: src/app/api/user/profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Импортируем нашу единую конфигурацию
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Обработчик для PATCH запросов (частичное обновление)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    let updateData: {
      name?: string;
      email?: string;
      emailVerified?: Date | null;
      passwordHash?: string;
    } = {};

    // --- Логика обновления ИМЕНИ ---
    if (name) {
      if (name.length < 2) {
        return NextResponse.json(
          { error: 'Имя должно содержать минимум 2 символа' },
          { status: 400 },
        );
      }
      updateData.name = name;
    }

    // --- Логика обновления EMAIL ---
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Этот email уже используется другим пользователем' },
          { status: 409 },
        );
      }
      updateData.email = email;
      // Важно! Сбрасываем верификацию при смене email.
      updateData.emailVerified = null;
    }

    // --- Логика обновления ПАРОЛЯ ---
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Для смены пароля необходимо указать текущий пароль' },
          { status: 400 },
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Новый пароль должен содержать не менее 8 символов' },
          { status: 400 },
        );
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user?.passwordHash) {
        return NextResponse.json({ error: 'Учетная запись не имеет пароля' }, { status: 400 });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 403 });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    
    // Если данных для обновления нет, возвращаем ошибку.
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 });
    }

    // Обновляем пользователя в базе данных.
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // Возвращаем успешный ответ с обновленными данными (без хэша пароля).
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