// Местоположение: src/app/api/user/profile/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { createHash, encrypt } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем обе утилиты

// --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем тип для данных на обновление ---
type UserUpdateData = {
  name_encrypted?: string;
  email_hash?: string;
  email_encrypted?: string;
  emailVerified?: Date | null;
  passwordHash?: string;
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const updateData: UserUpdateData = {};

    // --- Логика обновления ИМЕНИ (с шифрованием) ---
    if (name) {
      if (name.length < 2) {
        return NextResponse.json(
          { error: 'Имя должно содержать минимум 2 символа' },
          { status: 400 },
        );
      }
      updateData.name_encrypted = encrypt(name);
    }

    // --- Логика обновления EMAIL (с хэшированием и шифрованием) ---
    if (email) {
      const emailHash = createHash(email);
      const existingUser = await prisma.user.findUnique({
        where: { email_hash: emailHash },
      });
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Этот email уже используется другим пользователем' },
          { status: 409 },
        );
      }
      updateData.email_hash = emailHash;
      updateData.email_encrypted = encrypt(email);
      updateData.emailVerified = null; // Сбрасываем верификацию
    }

    // --- Логика обновления ПАРОЛЯ (без изменений) ---
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

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (!user?.passwordHash) {
        return NextResponse.json(
          { error: 'Учетная запись не имеет пароля' },
          { status: 400 },
        );
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Неверный текущий пароль' },
          { status: 403 },
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

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
