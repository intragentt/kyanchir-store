// Местоположение: /src/app/api/auth/password-reset/confirm/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { createHash } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем нашу утилиту хэширования

export async function POST(req: Request) {
  try {
    const { token, newPassword }: { token?: string; newPassword?: string } =
      await req.json();

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

    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken || passwordResetToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или её срок истёк' },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем хэш для поиска пользователя ---
    const emailHash = createHash(passwordResetToken.email);

    await prisma.$transaction([
      prisma.user.update({
        // Ищем пользователя по email_hash
        where: { email_hash: emailHash },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      }),
    ]);
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    console.log(
      `[Reset Confirm] Пароль для ${passwordResetToken.email} успешно изменен.`,
    );

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
