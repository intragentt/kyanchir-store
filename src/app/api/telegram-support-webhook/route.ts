// Местоположение: /src/app/api/telegram-support-webhook/route.ts

import { NextResponse } from 'next/server';
import { getBotInstance, setWebhook } from '@/lib/telegramService';
import prisma from '@/lib/prisma';
import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';
import { SenderType, TicketStatus } from '@prisma/client';

const bot = getBotInstance();
setWebhook();

// --- НАЧАЛО ИЗМЕНЕНИЙ: НОВАЯ ФУНКЦИЯ ДЛЯ ОБРАБОТКИ КНОПОК ---
async function handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    const { data, message, from } = callbackQuery;

    if (!data || !message) return;

    const chatId = message.chat.id;
    const messageId = message.message_id;

    // 1. Проверяем, что нажавший - верифицированный агент
    const agent = await prisma.supportAgent.findFirst({ where: { telegramId: String(from.id) } });
    if (!agent) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Ошибка: Вы не верифицированы.' });
        return;
    }

    // 2. Парсим данные из callback_data (формат: `action_type_ticketId`)
    const [action, type, ticketId] = data.split('_');

    if (action !== 'ticket' || !type || !ticketId) return;

    try {
        let newStatus: TicketStatus | undefined;
        let responseText = '';

        if (type === 'ack') { // Acknowledge - "Взять в работу"
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
            // Редактируем исходное сообщение, убирая кнопки и добавляя подпись
            await bot.editMessageText(
                `${message.text}\n\n---\n<b>${responseText}</b>`, 
                { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' }
            );
            await bot.answerCallbackQuery(callbackQuery.id, { text: 'Статус тикета обновлен!' });
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, { text: 'Неизвестное действие' });
        }
    } catch (error) {
        console.error(`Ошибка при обработке callback'а ${data}:`, error);
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка', show_alert: true });
    }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

async function handleTicketsCommand(msg: TelegramBot.Message) {
  // ... (эта функция без изменений)
  const { from, chat } = msg;
  if (!from) return;
  const agent = await prisma.supportAgent.findFirst({ where: { telegramId: String(from.id) } });
  if (!agent) { await bot.sendMessage(chat.id, '❌ Сначала нужно верифицироваться. Введите /start'); return; }
  const openTickets = await prisma.supportTicket.findMany({ where: { status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] } }, orderBy: { createdAt: 'desc' }, take: 10 });
  if (openTickets.length === 0) { await bot.sendMessage(chat.id, '🎉 Все тикеты обработаны! Новых обращений нет.'); return; }
  let responseText = '<b>📝 Последние открытые тикеты:</b>\n\n';
  openTickets.forEach((ticket) => { responseText += `<b>ID:</b> <code>${ticket.id}</code>\n<b>Тема:</b> ${ticket.subject}\n<b>От:</b> ${ticket.clientEmail}\n<b>Статус:</b> ${ticket.status === 'PENDING' ? '⏳ В работе' : '🆕 Новый'}\n--------------------\n`; });
  await bot.sendMessage(chat.id, responseText, { parse_mode: 'HTML' });
}

async function handleReplyToTicket(msg: TelegramBot.Message) {
  // ... (эта функция с ИСПРАВЛЕННЫМИ КАВЫЧКАМИ)
  const { from, chat, text, reply_to_message } = msg;
  if (!from || !text || !reply_to_message || !reply_to_message.text) { return; }
  const chatId = chat.id;
  const agent = await prisma.supportAgent.findFirst({ where: { telegramId: String(from.id) } });
  if (!agent) { await bot.sendMessage(chatId, '❌ Ошибка: вы не являетесь верифицированным агентом поддержки.'); return; }
  try {
    const match = reply_to_message.text.match(/start=ticket_([a-zA-Z0-9]+)/);
    // --- ИСПРАВЛЕНИЕ КАВЫЧЕК ---
    if (!match || !match[1]) {
      await bot.sendMessage(chatId, '⚠️ Не удалось найти ID тикета в исходном сообщении. Пожалуйста, отвечайте только на уведомления о тикетах.');
      return;
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
    const ticketId = match[1];
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) { await bot.sendMessage(chatId, `❌ Не удалось найти тикет с ID: ${ticketId}`); return; }
    const transporter = nodemailer.createTransport({ host: process.env.EMAIL_SERVER_HOST, port: parseInt(process.env.EMAIL_SERVER_PORT!), auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD } });
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to: ticket.clientEmail, subject: `Re: ${ticket.subject}`, text: text, html: `<p>${text.replace(/\n/g, '<br>')}</p>` });
    await prisma.supportMessage.create({ data: { ticketId: ticket.id, content: text, senderType: SenderType.AGENT, agentId: agent.id } });
    await bot.sendMessage(chatId, `✅ Ответ успешно отправлен клиенту ${ticket.clientEmail}`);
  } catch (error) {
    console.error('Ошибка при обработке ответа на тикет:', error);
    await bot.sendMessage(chatId, '🆘 Произошла ошибка при отправке ответа. Пожалуйста, проверьте консоль сервера.');
  }
}

async function handleStartCommand(msg: TelegramBot.Message) {
  // ... (эта функция без изменений)
  if (!msg.from) return;
  const { id: telegramId, username, first_name: firstName } = msg.from;
  const chatId = msg.chat.id;
  const existingAgent = await prisma.supportAgent.findFirst({ where: { telegramId: String(telegramId) } });
  if (existingAgent) { await bot.sendMessage(chatId, `✅ С возвращением, ${firstName}! Вы уже верифицированы и готовы к работе.`); return; }
  const potentialAgent = await prisma.supportAgent.findFirst({ where: { internalUsername: username, telegramId: null } });
  if (!potentialAgent) { await bot.sendMessage(chatId, `❌ Здравствуйте, ${firstName}. К сожалению, вас нет в списке верифицированных сотрудников. Доступ запрещен.`); return; }
  const updatedAgent = await prisma.supportAgent.update({ where: { id: potentialAgent.id }, data: { telegramId: String(telegramId) } });
  await bot.sendMessage(chatId, `🎉 Добро пожаловать, ${updatedAgent.name}! Ваш аккаунт успешно верифицирован. Теперь вы будете получать уведомления о новых тикетах.`);
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
    const callbackQuery = body.callback_query as TelegramBot.CallbackQuery | undefined; // --- ИЗМЕНЕНИЕ ---

    // --- НАЧАЛО ИЗМЕНЕНИЙ: ОБРАБОТКА НАЖАТИЙ ---
    if (callbackQuery) {
        await handleCallbackQuery(callbackQuery); // <-- ВЫЗЫВАЕМ НОВУЮ ФУНКЦИЮ
        return NextResponse.json({ status: 'ok' }); // Завершаем обработку
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    if (!msg || !msg.text) {
      return NextResponse.json({ message: 'Update is not a message' });
    }

    if (msg.text.startsWith('/start')) {
      await handleStartCommand(msg);
    } else if (msg.text.startsWith('/tickets')) {
      await handleTicketsCommand(msg);
    } else if (msg.reply_to_message) {
      await handleReplyToTicket(msg);
    } else {
      await bot.sendMessage(msg.chat.id, 'Неизвестная команда. Доступные команды: /start, /tickets');
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка в обработчике вебхука админ-бота:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}