// Местоположение: src/app/api/auth/telegram/check/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Token required' }, { status: 400 });
    }

    // Ищем "билет" в "кассе".
    const loginToken = await prisma.loginToken.findUnique({
      where: { token },
    });
    
    // Если у "билета" есть userId, значит он "активирован".
    if (loginToken?.userId) {
      return NextResponse.json({ status: 'activated', userId: loginToken.userId });
    }

    // Проверяем, не истек ли срок годности "билета".
    if (loginToken && new Date() > new Date(loginToken.expires)) {
        return NextResponse.json({ status: 'expired' });
    }

    // Если ничего не произошло, значит "билет" все еще "ожидает активации".
    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('Error checking login token:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}