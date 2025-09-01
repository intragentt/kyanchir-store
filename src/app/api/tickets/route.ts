// Местоположение: /src/app/api/admin/tickets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

/**
 * API-эндпоинт для получения списка тикетов в админ-панели.
 * Доступно только для ролей ADMIN и MANAGEMENT.
 */
export async function GET(req: Request) {
  try {
    // 1. Проверяем сессию пользователя через наш хелпер
    const session = await getAuthSession();

    // 2. Проверяем, что есть сессия и роль
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Вы не авторизованы.' },
        { status: 401 },
      );
    }

    // 3. Проверяем роль пользователя
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGEMENT
    ) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Недостаточно прав.' },
        { status: 403 },
      );
    }

    // 4. Получаем тикеты из базы
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
