// Местоположение: src/app/api/auth/register/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { createHash, encrypt } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем обе утилиты

const ADMIN_EMAILS = ['intragentt@gmail.com', 'podovinikovone@mail.ru'].map(
  (email) => email.toLowerCase(),
);

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      password,
    }: { name?: string; email?: string; password?: string } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Имя, Email и пароль обязательны' },
        { status: 400 },
      );
    }

    const lowercasedEmail = email.toLowerCase();

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем хэш для поиска ---
    const emailHash = createHash(lowercasedEmail);

    const existingUser = await prisma.user.findUnique({
      where: { email_hash: emailHash },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const isUserAdmin = ADMIN_EMAILS.includes(lowercasedEmail);
    const targetRoleName = isUserAdmin ? 'ADMIN' : 'USER';
    console.log(
      `[Register] Регистрация для ${email}. Назначаемая роль: ${targetRoleName}`,
    );

    const role = await prisma.userRole.findUnique({
      where: { name: targetRoleName },
    });

    if (!role) {
      const errorMessage = `CRITICAL: Role '${targetRoleName}' not found in database.`;
      console.error(errorMessage);
      throw new Error('Server configuration error.');
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Создаем пользователя с зашифрованными данными ---
    const user = await prisma.user.create({
      data: {
        // Хэшируем email для поиска
        email_hash: emailHash,
        // Шифруем имя и email для хранения
        name_encrypted: encrypt(name),
        email_encrypted: encrypt(lowercasedEmail),
        // Остальные поля
        passwordHash,
        roleId: role.id,
      },
      include: {
        role: {
          select: { name: true },
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    console.log(
      `[Register] Пользователь ${lowercasedEmail} успешно создан с ролью ${user.role.name}`,
    );

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        userRole: user.role.name,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register API error:', error);
    const errorMessage =
      error instanceof Error && error.message !== 'Server configuration error.'
        ? error.message
        : 'Произошла внутренняя ошибка сервера';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
