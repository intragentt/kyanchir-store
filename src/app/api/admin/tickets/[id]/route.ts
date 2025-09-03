// Местоположение: /src/app/api/admin/tickets/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Убираем импорт типа UserRole ---
// import { UserRole } from '@prisma/client';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function GET(
  request: Request,
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем правильный тип для params ---
  { params }: { params: { id: string } },
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: 'Доступ запрещен.' }, { status: 401 });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Исправляем сравнение ролей ---
    if (
      session.user.role.name !== 'ADMIN' &&
      session.user.role.name !== 'MANAGEMENT'
    ) {
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      return NextResponse.json(
        { error: 'Недостаточно прав.' },
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

    // Здесь должен быть твой код для получения сообщений.
    // Я добавлю его на основе того, что было в MailClient.tsx
    const messages = await prisma.supportMessage.findMany({
      where: {
        ticketId: ticketId,
      },
      include: {
        agent: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
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
