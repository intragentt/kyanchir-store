// Местоположение: /src/app/api/telegram-support-webhook/route.ts

import { NextResponse } from 'next/server';
import { getBotInstance, setWebhook } from '@/lib/telegramService';
import prisma from '@/lib/prisma';
import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer'; // --- ИМПОРТ NODEMAILER ---
import { SenderType } from '@prisma/client';

const bot = getBotInstance();
setWebhook();

// --- НОВАЯ ФУНКЦИЯ: ЛОГИКА ОТВЕТА НА ТИКЕТ ---
async function handleReplyToTicket(msg: TelegramBot.Message) {
  const { from, chat, text, reply_to_message } = msg;

  // 1. Проверяем, что все необходимые части на месте
  if (!from || !text || !reply_to_message || !reply_to_message.text) {
    return; // Не можем обработать, если чего-то не хватает
  }
  const chatId = chat.id;

  // 2. Убеждаемся, что отвечающий - верифицированный агент
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
    // 3. Извлекаем ID тикета из "спрятанной" ссылки в оригинальном сообщении
    // Наш формат: `https://t.me/bot_name?start=ticket_THE_ID`
    const match = reply_to_message.text.match(/start=ticket_([a-zA-Z0-9]+)/);
    if (!match || !match[1]) {
      await bot.sendMessage(
        chatId,
        '⚠️ Не удалось найти ID тикета в исходном сообщении. Пожалуйста, отвечайте только на уведомления о тикетах.',
      );
      return;
    }
    const ticketId = match[1];

    // 4. Находим тикет в базе
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

    // 5. Отправляем email клиенту
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT!),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM, // e.g., "Kyanchir Support <support@kyanchir.ru>"
      to: ticket.clientEmail,
      subject: `Re: ${ticket.subject}`,
      text: text, // Текст ответа агента
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`, // Преобразуем переносы строк в <br> для HTML
    });

    // 6. Сохраняем ответ агента в нашей базе данных
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: text,
        senderType: SenderType.AGENT,
        agentId: agent.id,
      },
    });

    // 7. Сообщаем агенту об успехе
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

    if (!msg || !msg.text) {
      return NextResponse.json({ message: 'Update is not a message' });
    }

    if (msg.text.startsWith('/start')) {
      await handleStartCommand(msg);
    } else if (msg.reply_to_message) {
      // --- ЗАМЕНЯЕМ ЗАГЛУШКУ НА РЕАЛЬНЫЙ ВЫЗОВ ---
      await handleReplyToTicket(msg);
    } else {
      await bot.sendMessage(
        msg.chat.id,
        'Для начала работы введите команду /start',
      );
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка в обработчике вебхука админ-бота:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
