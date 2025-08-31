// Местоположение: /src/app/api/mail-webhook/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TicketSource, SenderType, TicketStatus } from '@prisma/client';
import formidable from 'formidable';
import { NextApiRequest } from 'next';
import { notifyAgents } from '@/lib/telegramService';

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
      return NextResponse.json(
        { error: 'Некорректные данные: отсутствует envelope' },
        { status: 400 },
      );
    }

    const envelope = JSON.parse(envelopeRaw);
    const toEmail = envelope.to[0];

    if (!toEmail || !fromEmail || !text) {
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
        `Ошибка: email ${toEmail} не найден в списке разрешенных маршрутов.`,
      );
      return NextResponse.json({
        message: 'Маршрут не найден, письмо проигнорировано.',
      });
    }

    let ticket = await prisma.supportTicket.findFirst({
      where: {
        clientEmail: fromEmail,
        status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] },
      },
    });

    if (!ticket) {
      ticket = await prisma.supportTicket.create({
        data: {
          clientEmail: fromEmail,
          subject: subject,
          status: TicketStatus.OPEN,
          source: TicketSource.EMAIL,
          assignedEmail: toEmail,
        },
      });
    } else {
      if (!ticket.assignedEmail) {
        await prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { assignedEmail: toEmail },
        });
      }
    }

    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: text,
        senderType: SenderType.CLIENT,
      },
    });

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    await notifyAgents({
      id: ticket.id,
      subject: ticket.subject,
      clientEmail: ticket.clientEmail,
      assignedEmail: toEmail,
    });
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
