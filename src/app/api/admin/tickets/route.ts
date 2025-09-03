// Местоположение: /src/app/api/admin/tickets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';

// --- НАЧАЛО ИЗМЕНЕНИЙ (1/2): Решаем ошибку сборки Next.js ---
// Явно указываем, что этот маршрут всегда динамический, так как он зависит от сессии.
export const dynamic = 'force-dynamic';
// --- КОНЕЦ ИЗМЕНЕНИЙ (1/2) ---

/**
 * API-эндпоинт для получения списка тикетов в админ-панели.
 * Доступно только для ролей ADMIN и MANAGEMENT.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Вы не авторизованы.' },
        { status: 401 },
      );
    }

    // Сохраняем твою логику проверки ролей
    if (
      session.user.role.name !== 'ADMIN' &&
      session.user.role.name !== 'MANAGEMENT'
    ) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Недостаточно прав.' },
        { status: 403 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ (2/2): Улучшаем запрос для админки ---
    // Включаем связанные данные, которые понадобятся на фронтенде
    const tickets = await prisma.supportTicket.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        status: true, // Включаем объект статуса (чтобы показать его имя/цвет)
        source: true, // Включаем источник
        _count: {
          select: { messages: true }, // Считаем количество сообщений в тикете
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ (2/2) ---

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Ошибка при получении тикетов для админки:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
