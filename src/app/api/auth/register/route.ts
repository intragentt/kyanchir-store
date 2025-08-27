// Местоположение: src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // 1. Принимаем все три поля из запроса.
    const {
      name,
      email,
      password,
    }: { name?: string; email?: string; password?: string } = await req.json();

    // 2. Обновляем валидацию.
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Имя, Email и пароль обязательны' },
        { status: 400 },
      );
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }, // 409 Conflict - более правильный статус для этого случая
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Создаем пользователя с именем.
    const user = await prisma.user.create({
      data: {
        name, // Добавляем имя
        email,
        passwordHash,
      },
    });

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // 4. Убираем всю логику ручного создания сессии.
    // Единственная задача этого роута - создать пользователя и сообщить об успехе.
    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }, // 201 Created - стандартный статус для успешного создания ресурса
    );
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
