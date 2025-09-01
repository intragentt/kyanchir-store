// Местоположение: /src/app/api/admin/tickets/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { UserRole } from '@prisma/client';

export async function GET(
  request: Request, // Оставляем стандартный Request
  { params }: any, // <-- ИЗМЕНЕНИЕ: Убираем строгую типизацию, ставим `any`
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: 'Доступ запрещен.' }, { status: 401 });
    }
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGEMENT
    ) {
      return NextResponse.json(
        { error: 'Недостаточно прав.' },
        { status: 403 },
      );
    }

    // Внутри функции мы все еще знаем, что `params.id` это строка
    const ticketId = params.id;
    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID тикета не предоставлен' },
        { status: 400 },
      );
    }
    // ... остальной код без изменений ...
    const messages = await prisma.supportMessage.findMany({
      /* ... */
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error(`Ошибка при получении сообщений для тикета:`, error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
