// Местоположение: src/app/api/auth/send-verification-code/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createTransport } from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    // 1. Генерируем код и срок его жизни
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем роль при создании пользователя ---

    // 2. Находим базовую роль 'CLIENT'.
    const clientRole = await prisma.userRole.findUnique({
      where: { name: 'CLIENT' },
    });

    if (!clientRole) {
      console.error("CRITICAL: 'CLIENT' role not found in database.");
      throw new Error('Default user role is not configured on the server.');
    }

    // 3. Находим или создаем пользователя, СРАЗУ указывая роль для случая `create`.
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        roleId: clientRole.id, // Вот недостающая, но обязательная связь!
      },
    });

    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    // 4. ПРАВИЛО ГИГИЕНЫ: Перед созданием нового токена, удаляем все старые для этого email.
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 5. Создаем новый, единственно верный токен верификации
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // 6. Отправляем письмо
    console.log('--- НАЧАЛО ОТПРАВКИ EMAIL (КАСТОМНЫЙ API) ---');
    console.log(`Цель: ${email}, Код: ${token}`);

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
      subject: `Ваш код для входа в Kyanchir: ${token}`,
      html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
               <h2 style="color: #333;">Ваш код для входа</h2>
               <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; padding: 15px; background-color: #f2f2f2; border-radius: 8px;">
                 ${token}
               </div>
             </div>`,
    });

    console.log('--- КОНЕЦ ОТПРАВКИ EMAIL ---');

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
