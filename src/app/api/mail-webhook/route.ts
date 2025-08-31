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
import { notifyAgents } from '@/lib/telegramService'; // --- НАЧАЛО ИЗМЕНЕНИЙ: ИМПОРТ ---

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

// --- ИЗМЕНЕНИЕ: Старая заглушка `notifyAgentsViaTelegram` полностью удалена ---

export async function POST(req: Request) {
  console.log('Получен входящий вебхук от SendGrid...');

  try {
    const { fields } = await parseForm(req);

    const getFieldAsString = (field: string | string[] | undefined): string => {
      if (Array.isArray(field)) {
        return field[0] || '';
      }
      return field || '';
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
    
    // --- НАЧАЛО ИЗМЕНЕНИЙ: ВЫЗЫВАЕМ НОВУЮ ФУНКЦИЮ ---
    await notifyAgents(
      { id: ticket.id, subject: ticket.subject, clientEmail: ticket.clientEmail },
      assignedRole
    );
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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