// Местоположение: src/app/api/auth/send-verification-code/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import sgMail from '@sendgrid/mail';
import { createHash, encrypt } from '@/lib/encryption'; // <-- ДОБАВЛЕНО: Импортируем обе утилиты

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const lowercasedEmail = email.toLowerCase();
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    const userRole = await prisma.userRole.findUnique({
      where: { name: 'USER' },
    });

    if (!userRole) {
      console.error("CRITICAL: 'USER' role not found in database.");
      throw new Error('Default user role is not configured on the server.');
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью переписываем логику upsert ---
    const emailHash = createHash(lowercasedEmail);

    await prisma.user.upsert({
      where: { email_hash: emailHash }, // Ищем по хэшу
      update: {}, // Если найден, ничего не делаем
      create: {
        email_hash: emailHash, // Сохраняем хэш
        email_encrypted: encrypt(lowercasedEmail), // Шифруем email
        // В качестве имени по умолчанию используем часть email до "@"
        name_encrypted: encrypt(lowercasedEmail.split('@')[0]),
        roleId: userRole.id,
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    await prisma.verificationToken.deleteMany({
      where: { identifier: lowercasedEmail },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: lowercasedEmail,
        token,
        expires,
      },
    });

    sgMail.setApiKey(process.env.EMAIL_SERVER_PASSWORD!);

    const msg = {
      to: lowercasedEmail,
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
