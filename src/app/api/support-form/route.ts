// Местоположение: /src/app/api/support-form/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// VVV--- УДАЛЯЕМ НЕИСПОЛЬЗУЕМЫЕ ИМПОРТЫ ENUM ---VVV
// import { TicketSource, SenderType, TicketStatus } from '@prisma/client';
import { notifyAgents } from '@/lib/telegramService';

interface SupportFormRequestBody {
  email: string;
  name?: string;
  subject: string;
  content: string;
}

export async function POST(req: Request) {
  console.log('Получен запрос на создание тикета через веб-форму...');

  try {
    const body: SupportFormRequestBody = await req.json();
    const { email, name, subject, content } = body;

    if (!email || !subject || !content) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: email, subject, content' },
        { status: 400 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ (1/4): Получаем ID всех нужных нам связанных сущностей ---
    const [openStatus, webFormSource, clientSenderType] = await Promise.all([
      prisma.ticketStatus.findUnique({ where: { name: 'OPEN' } }),
      prisma.ticketSource.findUnique({ where: { name: 'WEB_FORM' } }),
      prisma.senderType.findUnique({ where: { name: 'CLIENT' } }),
    ]);

    // Критическая проверка: если в БД нет базовых сущностей, система не может работать
    if (!openStatus || !webFormSource || !clientSenderType) {
      throw new Error(
        'Critical configuration error: Default records for Status, Source, or SenderType are missing in the database.',
      );
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ (1/4) ---

    const assignedEmail = 'support@kyanchir.ru';

    // --- НАЧАЛО ИЗМЕНЕНИЙ (2/4): Исправляем логику фильтрации ---
    let ticket = await prisma.supportTicket.findFirst({
      where: {
        clientEmail: email,
        status: {
          name: {
            in: ['OPEN', 'PENDING'], // <-- Используем строки
          },
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ (2/4) ---

    if (!ticket) {
      // --- НАЧАЛО ИЗМЕНЕНИЙ (3/4): Исправляем создание тикета ---
      ticket = await prisma.supportTicket.create({
        data: {
          clientEmail: email,
          clientName: name,
          subject: subject,
          statusId: openStatus.id, // <-- Используем ID
          sourceId: webFormSource.id, // <-- Используем ID
          assignedEmail: assignedEmail,
        },
      });
      // --- КОНЕЦ ИЗМЕНЕНИЙ (3/4) ---
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ (4/4): Исправляем создание сообщения ---
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: content,
        senderTypeId: clientSenderType.id, // <-- Используем ID
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ (4/4) ---

    await notifyAgents({
      id: ticket.id,
      subject: ticket.subject,
      clientEmail: ticket.clientEmail,
      assignedEmail: assignedEmail,
    });

    return NextResponse.json(
      { message: 'Ваше обращение успешно отправлено', ticketId: ticket.id },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Некорректный формат JSON' },
        { status: 400 },
      );
    }
    console.error(
      'Критическая ошибка при обработке запроса с формы поддержки:',
      error,
    );
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
