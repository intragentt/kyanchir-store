// Местоположение: /src/app/api/admin/tickets/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { UserRole } from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

/**
 * API-эндпоинт для получения ВСЕХ сообщений для ОДНОГО тикета.
 * @param params Динамический параметр из URL, в нашем случае { id: '...' }
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
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

    // Получаем ID тикета из параметров URL
    const ticketId = params.id;
    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID тикета не предоставлен' },
        { status: 400 },
      );
    }

    // Ищем все сообщения, связанные с этим тикетом
    const messages = await prisma.supportMessage.findMany({
      where: {
        ticketId: ticketId,
      },
      orderBy: {
        createdAt: 'asc', // Сортируем по возрастанию, чтобы получился вид чата
      },
      include: {
        // Также подтягиваем информацию об агенте, если он был отправителем
        agent: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // Можно также дополнительно проверить, существует ли сам тикет
    if (messages.length === 0) {
      const ticketExists = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });
      if (!ticketExists) {
        return NextResponse.json({ error: 'Тикет не найден' }, { status: 404 });
      }
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error(
      `Ошибка при получении сообщений для тикета ${params.id}:`,
      error,
    );
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}

// --- КОНЕЦ ИЗМЕНЕНИЙ ---
