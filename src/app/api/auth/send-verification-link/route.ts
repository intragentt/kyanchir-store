// Местоположение: src/app/api/auth/send-verification-link/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { createTransport } from 'nodemailer';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const email = session.user.email;

    // 1. Генерируем безопасный, случайный токен.
    const token = randomBytes(32).toString('hex');
    // 2. Устанавливаем срок жизни токена (например, 24 часа).
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3. Удаляем старые токены этого пользователя, чтобы избежать путаницы.
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 4. Сохраняем новый токен в базу данных.
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // 5. Создаем уникальную ссылку для верификации.
    const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    // 6. Настраиваем и отправляем письмо.
    const transport = createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    await transport.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Подтвердите ваш email для Kyanchir',
      html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
               <h2 style="color: #333;">Подтверждение Email</h2>
               <p>Пожалуйста, нажмите на кнопку ниже, чтобы подтвердить ваш email адрес.</p>
               <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; font-size: 16px; color: white; background-color: #6B80C5; text-decoration: none; border-radius: 5px;">
                 Подтвердить Email
               </a>
               <p style="font-size: 12px; color: #888;">Если вы не запрашивали это письмо, просто проигнорируйте его.</p>
             </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /send-verification-link error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
