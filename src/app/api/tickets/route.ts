// Местоположение: /src/app/api/admin/tickets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

/**
 * API-эндпоинт для получения списка тикетов в админ-панели.
 */
export async function GET(req: Request) {
  try {
    // -------------------------------------------------------------------
    // ВРЕМЕННАЯ ОТЛАДКА: Мы закомментировали проверку сессии,
    // чтобы убедиться, что сам запрос к базе данных работает.
    // Если после этого тикеты загрузятся, значит, проблема в авторизации.
    // НЕ ЗАБУДЬТЕ ВЕРНУТЬ ЭТОТ КОД ПОСЛЕ ПРОВЕРКИ!
    /*
    const session = await getAuthSession();

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
    */
    // -------------------------------------------------------------------

    console.log(
      '>>> [DEBUG] API /api/admin/tickets called without auth check.',
    );

    const tickets = await prisma.supportTicket.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`>>> [DEBUG] Found ${tickets.length} tickets in database.`);

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Ошибка при получении тикетов для админки:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
