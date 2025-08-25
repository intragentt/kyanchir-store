// Местоположение: src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const loginToken = await prisma.loginToken.findUnique({
      where: { token: token as string, expires: { gte: new Date() } },
      include: { user: true },
    });

    if (!loginToken || !loginToken.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const sessionPayload = {
      userId: loginToken.user.id,
      name: loginToken.user.name,
      email: loginToken.user.email,
    };
    const session = await encrypt(sessionPayload);

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Создаем ответ и устанавливаем cookie в заголовках
    const response = NextResponse.json({ success: true, user: sessionPayload });
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    
    await prisma.loginToken.delete({ where: { id: loginToken.id } });

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}