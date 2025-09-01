// Местоположение: /src/app/api/admin/tickets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth'; // Импортируем authOptions напрямую
import { getServerSession } from 'next-auth/next'; // Импортируем getServerSession
import { UserRole } from '@prisma/client';

/**
 * API-эндпоинт для получения списка тикетов в админ-панели.
 * Доступно только для ролей ADMIN и MANAGEMENT.
 */
export async function GET(req: Request) {
  // `req` теперь используется
  try {
    // Используем самый надежный способ получения сессии в Route Handlers,
    // явно передавая ему объект запроса.
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Вы не авторизованы.' },
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
      orderBy: {
        createdAt: 'desc',
      },
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
