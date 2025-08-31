// Местоположение: /src/app/api/support-form/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TicketSource, SenderType, TicketStatus } from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

// ЗАГЛУШКА: Эту функцию мы реализуем позже.
// Она будет одинаковой для обоих эндпоинтов.
// В идеале, её нужно вынести в отдельный сервис-файл, но пока оставим здесь для простоты.
async function notifyAgentsViaTelegram(
  ticketId: string,
  subject: string,
  from: string,
) {
  console.log(`--- TELEGRAM NOTIFICATION (from Web Form) ---`);
  console.log(`Новый тикет/сообщение: ${ticketId}`);
  console.log(`Тема: ${subject}`);
  console.log(`От: ${from}`);
  console.log(
    `Необходимо уведомить агентов с ролью SUPPORT (т.к. это форма поддержки).`,
  );
  // Здесь будет логика поиска агентов по роли и отправки им сообщения через Telegram Bot API
}

// Определяем тип ожидаемых данных в теле запроса
interface SupportFormRequestBody {
  email: string;
  name?: string; // Имя опционально
  subject: string;
  content: string;
}

export async function POST(req: Request) {
  console.log('Получен запрос на создание тикета через веб-форму...');

  try {
    // 1. Парсинг и валидация входящего JSON
    const body: SupportFormRequestBody = await req.json();
    const { email, name, subject, content } = body;

    if (!email || !subject || !content) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: email, subject, content' },
        { status: 400 },
      );
    }

    // 2. Поиск существующего тикета или создание нового
    // Логика идентична эндпоинту для почты
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
          clientName: name, // Сохраняем имя, если оно было предоставлено
          subject: subject,
          status: TicketStatus.OPEN,
          source: TicketSource.WEB_FORM, // Указываем, что источник - веб-форма
        },
      });
      console.log(`Создан новый тикет: ${ticket.id}`);
    } else {
      console.log(
        `Найден существующий тикет: ${ticket.id}. Добавляем новое сообщение.`,
      );
    }

    // 3. Создание нового сообщения в рамках тикета
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

    // 4. Отправка уведомления агентам (используем ту же заглушку)
    await notifyAgentsViaTelegram(ticket.id, ticket.subject, email);

    // 5. Возвращаем успешный ответ
    return NextResponse.json(
      { message: 'Ваше обращение успешно отправлено', ticketId: ticket.id },
      { status: 201 }, // 201 Created - более подходящий статус для создания новой сущности
    );
  } catch (error) {
    // Обработка ошибок, включая некорректный JSON
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

// --- КОНЕЦ ИЗМЕНЕНИЙ ---
