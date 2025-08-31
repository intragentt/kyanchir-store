// Местоположение: /src/app/api/telegram-support-webhook/route.ts

import { NextResponse } from 'next/server';
import { getBotInstance, setWebhook } from '@/lib/telegramService';
import prisma from '@/lib/prisma';
import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';
import { SenderType, TicketStatus } from '@prisma/client'; // --- ИЗМЕНЕНИЕ: Добавлен TicketStatus

const bot = getBotInstance();
setWebhook();

// --- НАЧАЛО ИЗМЕНЕНИЙ: НОВАЯ ФУНКЦИЯ ДЛЯ КОМАНДЫ /tickets ---
async function handleTicketsCommand(msg: TelegramBot.Message) {
  const { from, chat } = msg;
  if (!from) return;

  // 1. Проверяем, что агент верифицирован
  const agent = await prisma.supportAgent.findFirst({
    where: { telegramId: String(from.id) },
  });
  if (!agent) {
    await bot.sendMessage(
      chat.id,
      '❌ Сначала нужно верифицироваться. Введите /start',
    );
    return;
  }

  // 2. Ищем последние 10 открытых тикетов
  const openTickets = await prisma.supportTicket.findMany({
    where: {
      status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // 3. Формируем и отправляем ответ
  if (openTickets.length === 0) {
    await bot.sendMessage(
      chat.id,
      '🎉 Все тикеты обработаны! Новых обращений нет.',
    );
    return;
  }

  let responseText = '<b>📝 Последние открытые тикеты:</b>\n\n';

  openTickets.forEach((ticket) => {
    responseText += `<b>ID:</b> <code>${ticket.id}</code>\n`;
    responseText += `<b>Тема:</b> ${ticket.subject}\n`;
    responseText += `<b>От:</b> ${ticket.clientEmail}\n`;
    responseText += `<b>Статус:</b> ${ticket.status === 'PENDING' ? '⏳ В работе' : '🆕 Новый'}\n`;
    responseText += `--------------------\n`;
  });

  await bot.sendMessage(chat.id, responseText, { parse_mode: 'HTML' });
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

async function handleReplyToTicket(msg: TelegramBot.Message) {
  // ... (эта функция остается без изменений)
  const { from, chat, text, reply_to_message } = msg;
  if (!from || !text || !reply_to_message || !reply_to_message.text) {
    return;
  }
  const chatId = chat.id;
  const agent = await prisma.supportAgent.findFirst({
    where: { telegramId: String(from.id) },
  });
  if (!agent) {
    await bot.sendMessage(
      chatId,
      '❌ Ошибка: вы не являетесь верифицированным агентом поддержки.',
    );
    return;
  }
  try {
    const match = reply_to_message.text.match(/start=ticket_([a-zA-Z0-9]+)/);
    if (!match || !match[1]) {’
      await bot.sendMessage(
        chatId,
        '⚠️ Не удалось найти ID тикета в исходном сообщении. Пожалуйста, отвечайте только на уведомления о тикетах.',
  ’    );
      return;
    }
    const ticketId = match[1];
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      await bot.sendMessage(
        chatId,
        `❌ Не удалось найти тикет с ID: ${ticketId}`,
      );
      return;
    }
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT!),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: ticket.clientEmail,
      subject: `Re: ${ticket.subject}`,
      text: text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
    });
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: text,
        senderType: SenderType.AGENT,
        agentId: agent.id,
      },
    });
    await bot.sendMessage(
      chatId,
      `✅ Ответ успешно отправлен клиенту ${ticket.clientEmail}`,
    );
  } catch (error) {
    console.error('Ошибка при обработке ответа на тикет:', error);
    await bot.sendMessage(
      chatId,
      '🆘 Произошла ошибка при отправке ответа. Пожалуйста, проверьте консоль сервера.',
    );
  }
}

async function handleStartCommand(msg: TelegramBot.Message) {
  // ... (эта функция остается без изменений)
  if (!msg.from) return;
  const { id: telegramId, username, first_name: firstName } = msg.from;
  const chatId = msg.chat.id;
  const existingAgent = await prisma.supportAgent.findFirst({
    where: { telegramId: String(telegramId) },
  });
  if (existingAgent) {
    await bot.sendMessage(
      chatId,
      `✅ С возвращением, ${firstName}! Вы уже верифицированы и готовы к работе.`,
    );
    return;
  }
  const potentialAgent = await prisma.supportAgent.findFirst({
    where: { internalUsername: username, telegramId: null },
  });
  if (!potentialAgent) {
    await bot.sendMessage(
      chatId,
      `❌ Здравствуйте, ${firstName}. К сожалению, вас нет в списке верифицированных сотрудников. Доступ запрещен.`,
    );
    return;
  }
  const updatedAgent = await prisma.supportAgent.update({
    where: { id: potentialAgent.id },
    data: { telegramId: String(telegramId) },
  });
  await bot.sendMessage(
    chatId,
    `🎉 Добро пожаловать, ${updatedAgent.name}! Ваш аккаунт успешно верифицирован. Теперь вы будете получать уведомления о новых тикетах.`,
  );
}

export async function POST(req: Request) {
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (secretToken !== process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET) {
    console.warn('Получен запрос с неверным секретным токеном для админ-бота.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const msg = body.message as TelegramBot.Message | undefined;

    // --- ИЗМЕНЕНИЕ: В ЭТОЙ ВЕРСИИ НУЖНО ОБРАБАТЫВАТЬ НЕ ТОЛЬКО СООБЩЕНИЯ, НО И НАЖАТИЯ КНОПОК
    if (body.callback_query) {
      // TODO: Обработка нажатий на кнопки
      await bot.answerCallbackQuery(body.callback_query.id); // Сначала "отвечаем" телеграму, что получили нажатие
      await bot.sendMessage(
        body.callback_query.message.chat.id,
        `(Заглушка) Вы нажали на кнопку. Скоро здесь будет логика.`,
      );
      return NextResponse.json({ status: 'ok' });
    }

    if (!msg || !msg.text) {
      return NextResponse.json({
        message: 'Update is not a message or callback',
      });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: МАРШРУТИЗАЦИЯ КОМАНД ---
    if (msg.text.startsWith('/start')) {
      await handleStartCommand(msg);
    } else if (msg.text.startsWith('/tickets')) {
      // <-- Новая команда
      await handleTicketsCommand(msg);
    } else if (msg.reply_to_message) {
      await handleReplyToTicket(msg);
    } else {
      await bot.sendMessage(
        msg.chat.id,
        'Неизвестная команда. Доступные команды: /start, /tickets',
      );
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка в обработчике вебхука админ-бота:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
