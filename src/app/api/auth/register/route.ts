// Местоположение: src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/session'; // Мы снова используем нашу "шифровальную машину"
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function POST(req: Request) {
  try {
    const { email, password }: { email?: string; password?: string } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Сразу после создания пользователя, создаем для него сессию
    const sessionPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
    };
    const session = await encrypt(sessionPayload);

    const response = NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 },
    );
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    });

    return response;
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Произошла внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
