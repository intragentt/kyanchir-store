// Местоположение: /src/app/api/admin/tickets/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'; // <-- ИЗМЕНЕНИЕ: Используем NextRequest
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { UserRole } from '@prisma/client';

/**
 * API-эндпоинт для получения ВСЕХ сообщений для ОДНОГО тикета.
 */
export async function GET(
  request: NextRequest, // <-- ИЗМЕНЕНИЕ: Используем `request` и `NextRequest`
  { params }: { params: { id: string } },
) {
  try {
    // Получение сессии остается прежним
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

    const ticketId = params.id;
    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID тикета не предоставлен' },
        { status: 400 },
      );
    }

    // Логика получения сообщений остается прежней
    const messages = await prisma.supportMessage.findMany({
      where: { ticketId: ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        agent: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

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
