// Местоположение: src/app/api/auth/telegram/finalize/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID required' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ user, expires });

    // --- НАЧАЛО ИЗМЕНЕНИЙ: "Хитрый Адаптер" ---
    // TypeScript в среде сборки Vercel по какой-то причине считает, что cookies()
    // возвращает Promise. Мы "подыгрываем" ему, добавляя `await`.
    // Это не сломает логику, но удовлетворит проверку типов.
    const cookieStore = await cookies();
    cookieStore.set('session', session, { expires, httpOnly: true });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error finalizing login:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
