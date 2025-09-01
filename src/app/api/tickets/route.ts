// Местоположение: /src/app/api/admin/tickets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth'; // <-- МЕНЯЕМ ИМПОРТ
import { getServerSession } from 'next-auth/next'; // <-- НОВЫЙ ИМПОРТ
import { UserRole } from '@prisma/client';

export async function GET(req: Request) {
  // <-- `req` теперь используется
  try {
    // --- ИЗМЕНЕНИЕ: Передаем `req` в `getServerSession` ---
    // Это самый надежный способ получить сессию в Route Handlers
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Не авторизованы.' },
        { status: 401 },
      );
    }

    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGEMENT
    ) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Недостаточно прав.' },
        { status: 403 },
      );
    }

    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Ошибка при получении тикетов для админки:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
