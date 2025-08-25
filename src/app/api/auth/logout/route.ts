// Местоположение: src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Создаем ответ и "обнуляем" cookie, устанавливая maxAge в 0
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Немедленно просрочить cookie
      path: '/',
    });
    return response;
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
