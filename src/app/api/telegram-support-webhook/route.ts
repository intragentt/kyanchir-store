// Местоположение: /src/app/api/telegram-support-webhook/route.ts

import { NextResponse } from 'next/server';
import { getBotInstance, setWebhook } from '@/lib/telegramService';
import prisma from '@/lib/prisma';
import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';

const bot = getBotInstance();
setWebhook();

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
      const ticketId = rest[0];
      let newStatusName: string | undefined;
      let responseText = '';

      if (type === 'ack') {
        newStatusName = 'PENDING';
        responseText = `⏳ Тикет взят в работу агентом ${agent.name}`;
      } else if (type === 'close') {
        newStatusName = 'RESOLVED';
        responseText = `✅ Тикет закрыт агентом ${agent.name}`;
      }

      if (newStatusName) {
        const statusToSet = await prisma.ticketStatus.findUnique({
          where: { name: newStatusName },
        });
        if (!statusToSet)
          throw new Error(`Status ${newStatusName} not found in DB`);

        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        // Обновляем ТОЛЬКО статус. Поля agentId в тикете нет.
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            statusId: statusToSet.id,
          },
        });
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---

        await bot.editMessageText(
          `${message.text}\n\n---\n<b>${responseText}</b>`,
          { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' },
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Статус тикета обновлен!',
        });
      }
    } else if (action === 'reply') {
      const ticketId = rest[0];
      const originalMessageId = parseInt(rest[1]);
      const fromEmail = type.replace(/-/g, '@');

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
        from: `"${agent.name} (Kyanchir Support)" <${fromEmail}>`,
        to: ticket.clientEmail,
        subject: `Re: ${ticket.subject}`,
        text: replyText,
        html: `<p>${replyText.replace(/\n/g, '<br>')}</p>`,
      });

      const agentSenderType = await prisma.senderType.findUnique({
        where: { name: 'AGENT' },
      });
      if (!agentSenderType) throw new Error('SenderType AGENT not found in DB');

      // Здесь agentId на своем месте, так как он есть в модели SupportMessage
      await prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          content: replyText,
          senderTypeId: agentSenderType.id,
          agentId: agent.id,
        },
      });

      temporaryReplies.delete(originalMessageId);

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

  const idMatch = reply_to_message.text.match(/ID тикета: ([a-zA-Z0-9-]+)/);
  if (!idMatch || !idMatch[1]) {
    return await bot.sendMessage(
      chat.id,
      '⚠️ Не удалось найти ID тикета. Отвечайте только на уведомления о тикетах.',
    );
  }
  const ticketId = idMatch[1];

  temporaryReplies.set(message_id, text);
  setTimeout(() => temporaryReplies.delete(message_id), 15 * 60 * 1000);

  const availableEmails = await prisma.supportRoute.findMany({
    select: { kyanchirEmail: true },
  });
  if (availableEmails.length === 0) {
    return await bot.sendMessage(
      chat.id,
      '❌ В базе не найдено ни одного email для отправки.',
    );
  }

  const emailKeyboard: TelegramBot.InlineKeyboardButton[][] =
    availableEmails.map((route) => [
      {
        text: route.kyanchirEmail,
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
      await stageReplyToTicket(msg);
    } else {
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
