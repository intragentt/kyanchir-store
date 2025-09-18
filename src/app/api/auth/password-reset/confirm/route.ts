// Местоположение: /src/app/api/auth/password-reset/confirm/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const {
      token,
      newPassword,
    }: { token?: string; newPassword?: string } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Токен и новый пароль обязательны' },
        { status: 400 },
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать не менее 8 символов' },
        { status: 400 },
      );
    }

    // 1. Находим токен в "сейфе"
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // 2. Проверяем, что он валиден и не просрочен
    if (!passwordResetToken || passwordResetToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или её срок истёк' },
        { status: 400 },
      );
    }

    // 3. Хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 4. Используем транзакцию для "железобетонной" надежности
    // Она либо выполнит ОБЕ операции, либо не выполнит ни одной.
    await prisma.$transaction([
      // Операция 1: Обновляем пароль пользователя
      prisma.user.update({
        where: { email: passwordResetToken.email },
        data: { passwordHash },
      }),
      // Операция 2: Уничтожаем использованный токен
      prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      }),
    ]);
    
    console.log(`[Reset Confirm] Пароль для ${passwordResetToken.email} успешно изменен.`);

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменён.',
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}