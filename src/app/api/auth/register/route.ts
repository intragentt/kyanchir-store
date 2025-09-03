// Местоположение: src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Ищем правильную роль 'CLIENT' ---

    // 1. Находим базовую роль 'CLIENT' в базе данных.
    const userRole = await prisma.userRole.findUnique({
      where: { name: 'CLIENT' }, // Было 'USER', стало 'CLIENT'
    });

    // 2. Если по какой-то причине роль 'CLIENT' не найдена,
    // это критическая ошибка конфигурации.
    if (!userRole) {
      console.error("CRITICAL: 'CLIENT' role not found in database.");
      throw new Error('Default user role is not configured on the server.');
    }

    // 3. Создаем пользователя, СРАЗУ СВЯЗЫВАЯ его с найденной ролью.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roleId: userRole.id, // Присваиваем ID роли 'CLIENT'
      },
    });

    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register API error:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Произошла внутренняя ошибка сервера';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
