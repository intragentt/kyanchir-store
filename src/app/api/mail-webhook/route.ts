// Местоположение: /src/app/api/mail-webhook/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  AgentRole,
  TicketSource,
  SenderType,
  TicketStatus,
} from '@prisma/client';
import formidable from 'formidable';
import { NextApiRequest } from 'next';

async function parseForm(
  req: Request,
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({});
    form.parse(req as unknown as NextApiRequest, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

async function notifyAgentsViaTelegram(
  ticketId: string,
  subject: string,
  from: string,
) {
  console.log(`--- TELEGRAM NOTIFICATION ---`);
  console.log(`Новый тикет/сообщение: ${ticketId}`);
  console.log(`Тема: ${subject}`);
  console.log(`От: ${from}`);
  console.log(`Необходимо уведомить агентов с соответствующей ролью.`);
}

export async function POST(req: Request) {
  console.log('Получен входящий вебхук от SendGrid...');

  try {
    const { fields } = await parseForm(req);

    // --- НАЧАЛО ИЗМЕНЕНИЙ (БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ ДАННЫХ) ---

    // Функция-хелпер для безопасного извлечения строки из полей formidable
    const getFieldAsString = (field: string | string[] | undefined): string => {
      if (Array.isArray(field)) {
        return field[0] || ''; // Берем первый элемент, если это массив
      }
      return field || ''; // Возвращаем само значение или пустую строку
    };

    const envelopeRaw = getFieldAsString(fields.envelope);
    const fromEmail = getFieldAsString(fields.from);
    const subject = getFieldAsString(fields.subject);
    const text = getFieldAsString(fields.text);

    if (!envelopeRaw) {
      console.error("Ошибка: поле 'envelope' отсутствует или пусто.");
      return NextResponse.json(
        { error: 'Некорректные данные: отсутствует envelope' },
        { status: 400 },
      );
    }

    const envelope = JSON.parse(envelopeRaw);
    const toEmail = envelope.to[0];

    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    console.log(`Письмо от: ${fromEmail} на: ${toEmail}`);

    if (!toEmail || !fromEmail || !text) {
      console.error(
        'Ошибка: не все обязательные поля (to, from, text) были найдены после парсинга.',
      );
      return NextResponse.json(
        { error: 'Некорректные данные' },
        { status: 400 },
      );
    }

    const route = await prisma.supportRoute.findUnique({
      where: { kyanchirEmail: toEmail },
    });

    if (!route) {
      console.error(
        `Ошибка: не найден маршрут для email: ${toEmail}. Письмо не будет обработано.`,
      );
      return NextResponse.json({
        message: 'Маршрут не найден, письмо проигнорировано.',
      });
    }

    const assignedRole: AgentRole = route.assignedRole;
    console.log(`Назначенная роль для этого email: ${assignedRole}`);

    let ticket = await prisma.supportTicket.findFirst({
      where: {
        clientEmail: fromEmail,
        status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] },
      },
    });

    if (!ticket) {
      console.log(`Открытый тикет от ${fromEmail} не найден. Создаем новый.`);
      ticket = await prisma.supportTicket.create({
        data: {
          clientEmail: fromEmail,
          subject: subject,
          status: TicketStatus.OPEN,
          source: TicketSource.EMAIL,
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
        content: text,
        senderType: SenderType.CLIENT,
      },
    });

    console.log(`Сообщение успешно сохранено в тикете ${ticket.id}`);

    await notifyAgentsViaTelegram(ticket.id, ticket.subject, fromEmail);

    return NextResponse.json(
      { message: 'Вебхук успешно обработан' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Критическая ошибка при обработке вебхука SendGrid:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
