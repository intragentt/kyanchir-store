// Местоположение: /src/app/api/telegram-support-webhook/route.ts

import { NextResponse } from 'next/server';
import { getBotInstance, setWebhook } from '@/lib/telegramService';
import prisma from '@/lib/prisma';
import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';
import { SenderType, TicketStatus } from '@prisma/client';

const bot = getBotInstance();
setWebhook();

// --- НАЧАЛО ИЗМЕНЕНИЙ: ГЛОБАЛЬНЫЕ ИЗМЕНЕНИЯ ---

// Простое временное хранилище для текстов ответов { messageId: replyText }
const temporaryReplies = new Map<number, string>();

const AGENT_KEYBOARD: TelegramBot.ReplyKeyboardMarkup = {
  keyboard: [[{ text: '📝 Открытые тикеты' }], [{ text: '🆘 Помощь' }]],
  resize_keyboard: true,
};

async function handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
  const { data, message, from } = callbackQuery;
  if (!data || !message) return;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  const agent = await prisma.supportAgent.findFirst({
    where: { telegramId: String(from.id) },
  });
  if (!agent) {
    return await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Ошибка: Вы не верифицированы.',
    });
  }

  const [action, type, ...rest] = data.split('_');

  try {
    if (action === 'ticket') {
      // Обработка статусов: ack, close
      const ticketId = rest[0];
      let newStatus: TicketStatus | undefined;
      let responseText = '';

      if (type === 'ack') {
        newStatus = TicketStatus.PENDING;
        responseText = `⏳ Тикет взят в работу агентом ${agent.name}`;
      } else if (type === 'close') {
        newStatus = TicketStatus.RESOLVED;
        responseText = `✅ Тикет закрыт агентом ${agent.name}`;
      }

      if (newStatus) {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: newStatus },
        });
        await bot.editMessageText(
          `${message.text}\n\n---\n<b>${responseText}</b>`,
          { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' },
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Статус тикета обновлен!',
        });
      }
    } else if (action === 'reply') {
      // Обработка выбора email для ответа
      const ticketId = rest[0];
      const originalMessageId = parseInt(rest[1]);
      const fromEmail = type.replace(/-/g, '@'); // Восстанавливаем email из формата `support-kyanchir.ru`

      const replyText = temporaryReplies.get(originalMessageId);
      if (!replyText) {
        await bot.editMessageText(
          '❌ Время сессии истекло, текст ответа утерян. Пожалуйста, попробуйте ответить на тикет заново.',
          { chat_id: chatId, message_id: messageId },
        );
        return await bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Ошибка',
          show_alert: true,
        });
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });
      if (!ticket) return;

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT!),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"${agent.name} (Kyanchir Support)" <${fromEmail}>`, // Отправляем с выбранного email
        to: ticket.clientEmail,
        subject: `Re: ${ticket.subject}`,
        text: replyText,
        html: `<p>${replyText.replace(/\n/g, '<br>')}</p>`,
      });

      await prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          content: replyText,
          senderType: SenderType.AGENT,
          agentId: agent.id,
        },
      });

      temporaryReplies.delete(originalMessageId); // Чистим временное хранилище

      await bot.editMessageText(
        `✅ Ответ успешно отправлен клиенту ${ticket.clientEmail} с почты <b>${fromEmail}</b>.`,
        { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' },
      );
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Отправлено!' });
    }
  } catch (error) {
    console.error(`Ошибка при обработке callback'а ${data}:`, error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Произошла ошибка',
      show_alert: true,
    });
  }
}

async function stageReplyToTicket(msg: TelegramBot.Message) {
  const { from, chat, text, reply_to_message, message_id } = msg;
  if (!from || !text || !reply_to_message || !reply_to_message.text) return;

  const match = reply_to_message.text.match(/start=ticket_([a-zA-Z0-9]+)/);
  if (!match || !match[1]) {
    return await bot.sendMessage(
      chat.id,
      '⚠️ Не удалось найти ID тикета. Отвечайте только на уведомления о тикетах.',
    );
  }
  const ticketId = match[1];

  // Сохраняем текст ответа во временное хранилище
  temporaryReplies.set(message_id, text);
  // Устанавливаем таймер на удаление, чтобы не хранить вечно
  setTimeout(() => temporaryReplies.delete(message_id), 15 * 60 * 1000); // 15 минут

  // Получаем список всех наших email из базы
  const availableEmails = await prisma.supportRoute.findMany({
    select: { kyanchirEmail: true },
  });
  if (availableEmails.length === 0) {
    return await bot.sendMessage(
      chat.id,
      '❌ В базе не найдено ни одного email для отправки.',
    );
  }

  // Формируем кнопки с выбором почты
  const emailKeyboard: TelegramBot.InlineKeyboardButton[][] =
    availableEmails.map((route) => [
      {
        text: route.kyanchirEmail,
        // Формат callback_data: reply_email-with-dash_ticketId_originalMessageId
        callback_data: `reply_${route.kyanchirEmail.replace(/@/g, '-')}_${ticketId}_${message_id}`,
      },
    ]);

  await bot.sendMessage(chat.id, '👇 С какой почты отправить этот ответ?', {
    reply_markup: { inline_keyboard: emailKeyboard },
  });
}

async function handleTicketsCommand(msg: TelegramBot.Message) {
  /* ... без изменений ... */
}
async function handleStartCommand(msg: TelegramBot.Message) {
  /* ... без изменений ... */
}

export async function POST(req: Request) {
  // ... (проверка токена)

  try {
    const body = await req.json();
    const msg = body.message as TelegramBot.Message | undefined;
    const callbackQuery = body.callback_query as
      | TelegramBot.CallbackQuery
      | undefined;

    if (callbackQuery) {
      await handleCallbackQuery(callbackQuery);
      return NextResponse.json({ status: 'ok' });
    }
    if (!msg || !msg.text)
      return NextResponse.json({ message: 'Update not processed' });

    const { text, chat } = msg;

    if (text.startsWith('/start')) {
      await handleStartCommand(msg);
    } else if (
      text.startsWith('/tickets') ||
      text.includes('Открытые тикеты')
    ) {
      await handleTicketsCommand(msg);
    } else if (msg.reply_to_message) {
      // ТЕПЕРЬ ОТВЕТ ТОЛЬКО ГОТОВИТСЯ К ОТПРАВКЕ
      await stageReplyToTicket(msg);
    } else {
      // TODO: Добавить логику написания первым по email
      await bot.sendMessage(
        chat.id,
        'Неизвестная команда. Используйте клавиатуру или команды /start, /tickets',
      );
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка в обработчике вебхука:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
// --- КОНЕЦ ГЛОБАЛЬНЫХ ИЗМЕНЕНИЙ ---
