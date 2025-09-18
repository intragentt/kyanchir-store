// Местоположение: src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Список email-адресов, которые должны автоматически становиться администраторами.
const ADMIN_EMAILS = ['intragentt@gmail.com', 'podovinikovone@mail.ru'].map(
  (email) => email.toLowerCase(),
); // Приводим к нижнему регистру для надежности
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

    const lowercasedEmail = email.toLowerCase(); // Всегда работаем с нижним регистром

    const existingUser = await prisma.user.findUnique({
      where: { email: lowercasedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // --- НАЧАЛО ИЗМЕНЕНИЙ: "Умное" назначение роли ---

    // 1. Определяем, какую роль должен получить пользователь.
    const isUserAdmin = ADMIN_EMAILS.includes(lowercasedEmail);
    const targetRoleName = isUserAdmin ? 'ADMIN' : 'USER';
    console.log(
      `[Register] Регистрация для ${email}. Назначаемая роль: ${targetRoleName}`,
    );

    // 2. Находим ID нужной роли в базе данных.
    const role = await prisma.userRole.findUnique({
      where: { name: targetRoleName },
    });

    // 3. Если нужная роль не найдена — это критическая ошибка.
    if (!role) {
      const errorMessage = `CRITICAL: Role '${targetRoleName}' not found in database.`;
      console.error(errorMessage);
      throw new Error('Server configuration error.');
    }

    // 4. Создаем пользователя, связывая его с правильной ролью.
    const user = await prisma.user.create({
      data: {
        name,
        email: lowercasedEmail, // Сохраняем email в нижнем регистре
        passwordHash,
        roleId: role.id,
      },
      // Включаем информацию о роли в ответ для отладки
      include: {
        role: {
          select: { name: true },
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    console.log(
      `[Register] Пользователь ${user.email} успешно создан с ролью ${user.role.name}`,
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
