// Местоположение: src/app/api/auth/check-login-token/route.ts (НОВЫЙ ФАЙЛ)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Этот маршрут - наше "табло". Он принимает номер билета и говорит, активирован ли он.
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Ищем билет в базе.
    const loginToken = await prisma.loginToken.findUnique({
      where: { token },
    });

    // Если билета нет или у него все еще нет привязанного userId,
    // значит, он еще не активирован.
    if (!loginToken || !loginToken.userId) {
      return NextResponse.json({ activated: false });
    }

    // Если userId есть, значит, "Бот-Привратник" сделал свою работу!
    return NextResponse.json({ activated: true });
  } catch (error) {
    console.error('Error checking login token:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
