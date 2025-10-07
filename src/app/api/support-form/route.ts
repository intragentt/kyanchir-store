// Местоположение: /src/app/api/support-form/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSupportBot } from '@/lib/telegram'; // <-- ИЗМЕНЕНО: Импортируем ленивый доступ к Telegraf-боту
import { Markup } from 'telegraf'; // <-- ДОБАВЛЕНО: Импортируем хелпер для клавиатур

interface SupportFormRequestBody {
  email: string;
  name?: string;
  subject: string;
  content: string;
}

// --- НАЧАЛО ИЗМЕНЕНИЙ: Новая, самодостаточная функция уведомлений ---
async function notifyAgents(ticket: {
  id: string;
  subject: string;
  clientEmail: string;
  assignedEmail: string | null;
}) {
  const agentsToNotify = await prisma.supportAgent.findMany({
    where: {
      telegramId: { not: null },
      role: {
        name: { in: ['ADMIN', 'MANAGEMENT', 'SUPPORT'] },
      },
    },
  });

  if (agentsToNotify.length === 0) {
    console.warn(`Нет агентов для уведомления о тикете ${ticket.id}`);
    return;
  }

  const supportBot = getSupportBot();

  const messageText = `
📬 **Новое обращение!** (на ${ticket.assignedEmail || 'support'})
<b>От:</b> ${ticket.clientEmail}
<b>Тема:</b> ${ticket.subject}
<i>ID тикета: ${ticket.id}</i>
<i>Используйте "Ответить" (Reply), чтобы написать клиенту.</i>
  `;

  // Используем Markup из Telegraf для создания клавиатуры
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('Взять в работу ⏳', `ticket_ack_${ticket.id}`),
      Markup.button.callback('Закрыть тикет ✅', `ticket_close_${ticket.id}`),
    ],
    [
      Markup.button.url(
        'Посмотреть на сайте ↗️',
        `${process.env.NEXTAUTH_URL}/admin/mail?ticketId=${ticket.id}`,
      ),
    ],
  ]);

  for (const agent of agentsToNotify) {
    try {
      if (agent.telegramId) {
        // Используем наш новый supportBot для отправки
        await supportBot.telegram.sendMessage(agent.telegramId, messageText, {
          parse_mode: 'HTML',
          ...keyboard,
        });
      }
    } catch (error: any) {
      console.error(
        `Не удалось отправить уведомление агенту ${agent.name} (ID: ${agent.telegramId}):`,
        error.message,
      );
    }
  }

  console.log(
    `Уведомления о тикете ${ticket.id} отправлены ${agentsToNotify.length} агентам.`,
  );
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

    const [openStatus, webFormSource, clientSenderType] = await Promise.all([
      prisma.ticketStatus.findUnique({ where: { name: 'OPEN' } }),
      prisma.ticketSource.findUnique({ where: { name: 'WEB_FORM' } }),
      prisma.senderType.findUnique({ where: { name: 'CLIENT' } }),
    ]);

    if (!openStatus || !webFormSource || !clientSenderType) {
      throw new Error(
        'Critical configuration error: Default records for Status, Source, or SenderType are missing in the database.',
      );
    }

    const assignedEmail = 'support@kyanchir.ru';

    let ticket = await prisma.supportTicket.findFirst({
      where: {
        clientEmail: email,
        status: {
          name: { in: ['OPEN', 'PENDING'] },
        },
      },
    });

    if (!ticket) {
      ticket = await prisma.supportTicket.create({
        data: {
          clientEmail: email,
          clientName: name,
          subject: subject,
          statusId: openStatus.id,
          sourceId: webFormSource.id,
          assignedEmail: assignedEmail,
        },
      });
    }

    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: content,
        senderTypeId: clientSenderType.id,
      },
    });

    // Вызываем нашу новую, локальную функцию
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
