// Местоположение: src/app/api/auth/telegram/start/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import { randomBytes } from 'crypto';

export async function POST() {
  try {
    const token = randomBytes(32).toString('hex');
    const expires = addMinutes(new Date(), 5);

    const loginToken = await prisma.loginToken.create({
      data: { token, expires },
    });

    return NextResponse.json({
      token: loginToken.token,
      botUsername:
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'kyanchir_store_bot',
      expiresAt: loginToken.expires.toISOString(),
    });
  } catch (error) {
    console.error('Error creating login token:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
