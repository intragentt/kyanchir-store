// Местоположение: /src/app/api/support-form/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  TicketSource,
  SenderType,
  TicketStatus,
  AgentRole,
} from '@prisma/client';
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

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---

    // Сообщениям с веб-формы по умолчанию присваиваем почту support@...
    const assignedEmail = 'support@kyanchir.ru';

    let ticket = await prisma.supportTicket.findFirst({
      where: {
        clientEmail: email,
        status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] },
      },
    });

    if (!ticket) {
      console.log(`Открытый тикет от ${email} не найден. Создаем новый.`);
      ticket = await prisma.supportTicket.create({
        data: {
          clientEmail: email,
          clientName: name,
          subject: subject,
          status: TicketStatus.OPEN,
          source: TicketSource.WEB_FORM,
          assignedEmail: assignedEmail, // <--- Запоминаем email
        },
      });
      console.log(`Создан новый тикет: ${ticket.id}`);
    } else {
      console.log(
        `Найден существующий тикет: ${ticket.id}. Добавляем новое сообщение.`,
      );
    }

    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: content,
        senderType: SenderType.CLIENT,
      },
    });

    console.log(
      `Сообщение от ${email} успешно сохранено в тикете ${ticket.id}`,
    );

    // Вызываем notifyAgents с новым полем
    await notifyAgents(
      {
        id: ticket.id,
        subject: ticket.subject,
        clientEmail: ticket.clientEmail,
        assignedEmail: assignedEmail, // <--- Передаем email в уведомитель
      },
      AgentRole.SUPPORT,
    );
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
