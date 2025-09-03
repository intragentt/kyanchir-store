// Местоположение: src/app/api/auth/send-verification-code/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import sgMail from '@sendgrid/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    // 1. Генерируем код и срок его жизни
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // 2. Находим базовую роль 'USER'. Это "вакцина" от нашей предыдущей ошибки.
    const userRole = await prisma.userRole.findUnique({
      where: { name: 'USER' },
    });

    if (!userRole) {
      console.error("CRITICAL: 'USER' role not found in database.");
      throw new Error('Default user role is not configured on the server.');
    }

    // 3. Находим или создаем пользователя.
    // upsert - идеальный инструмент: он найдет существующего пользователя
    // или создаст нового, если это его первый вход, СРАЗУ присвоив ему роль.
    await prisma.user.upsert({
      where: { email },
      update: {}, // Если пользователь найден, ничего не меняем
      create: {
        email,
        roleId: userRole.id, // Если создаем нового - сразу даем ему роль
      },
    });

    // 4. Удаляем старые токены для этого email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 5. Создаем новый токен
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // 6. Отправляем email через SendGrid
    sgMail.setApiKey(process.env.EMAIL_SERVER_PASSWORD!);

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: `Ваш код для входа в Kyanchir: ${token}`,
      html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
               <h2 style="color: #333;">Ваш код для входа</h2>
               <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; padding: 15px; background-color: #f2f2f2; border-radius: 8px;">
                 ${token}
               </div>
             </div>`,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('!!! КРИТИЧЕСКАЯ ОШИБКА В /send-verification-code:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Произошла внутренняя ошибка сервера';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
