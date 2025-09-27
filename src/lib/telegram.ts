import { Telegraf, Context, Markup } from 'telegraf';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

// --- Валидация переменных окружения ---
const clientBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!clientBotToken) {
  throw new Error('Критическая ошибка: TELEGRAM_BOT_TOKEN не определен.');
}

const supportBotToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!supportBotToken) {
  throw new Error(
    'Критическая ошибка: TELEGRAM_SUPPORT_BOT_TOKEN не определен.',
  );
}

// --- Инициализация Инстансов Ботов ---
export const clientBot = new Telegraf(clientBotToken);
export const supportBot = new Telegraf(supportBotToken);

// --- Клавиатура Агента ---
const AGENT_KEYBOARD = Markup.keyboard([
  ['📝 Открытые тикеты'],
  ['🆘 Помощь'],
]).resize();

// --- Middleware: Проверка, что пользователь - авторизованный агент ---
const verifyAgent = async (ctx: Context, next: () => Promise<void>) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const agent = await prisma.supportAgent.findFirst({
    where: { telegramId: String(telegramId) },
  });

  if (!agent) {
    await ctx.reply(
      '❌ Доступ запрещен. Вы не являетесь верифицированным агентом поддержки.',
    );
    return;
  }
  (ctx as any).agent = agent;
  await next();
};

// --- Логика Бота Поддержки ---

// /start
supportBot.command('start', verifyAgent, async (ctx) => {
  await ctx.reply(
    `👋 Добро пожаловать, ${(ctx as any).agent.name}! Готовы к работе.`,
    AGENT_KEYBOARD,
  );
});

// /tickets или "📝 Открытые тикеты"
const handleTicketsRequest = async (ctx: Context) => {
  await ctx.reply('⏳ Загружаю список открытых тикетов...');
};
supportBot.command('tickets', verifyAgent, handleTicketsRequest);
supportBot.hears('📝 Открытые тикеты', verifyAgent, handleTicketsRequest);

// Обработка ответа агента на сообщение с тикетом
supportBot.on('message', verifyAgent, async (ctx) => {
  if (!('text' in ctx.message) || !ctx.message.reply_to_message) {
    return ctx.reply(
      'Неизвестная команда. Используйте клавиатуру или команды /start, /tickets.',
      AGENT_KEYBOARD,
    );
  }

  const text = ctx.message.text;
  const originalMessage = ctx.message.reply_to_message;

  if (!('text' in originalMessage) || !originalMessage.text) return;

  const idMatch = originalMessage.text.match(/ID тикета: ([a-zA-Z0-9-]+)/);
  if (!idMatch || !idMatch[1]) {
    return ctx.reply(
      '⚠️ Не удалось найти ID тикета. Отвечайте только на уведомления о тикетах.',
    );
  }
  const ticketId = idMatch[1];
  const agent = (ctx as any).agent;

  await prisma.temporaryReply.create({
    data: {
      agentMessageId: BigInt(ctx.message.message_id),
      replyText: text,
      ticketId: ticketId,
      agentId: agent.id,
    },
  });

  const availableEmails = await prisma.supportRoute.findMany({
    select: { kyanchirEmail: true },
  });

  if (availableEmails.length === 0) {
    return ctx.reply('❌ В базе не найдено ни одного email для отправки.');
  }

  const emailButtons = availableEmails.map((route) =>
    Markup.button.callback(
      route.kyanchirEmail,
      `reply_${route.kyanchirEmail}_${ticketId}_${ctx.message.message_id}`,
    ),
  );

  await ctx.reply(
    '👇 С какой почты отправить этот ответ?',
    Markup.inlineKeyboard(emailButtons),
  );
});

// --- Обработка Нажатий на Кнопки (Callback Query) ---

// Обработка кнопок "Взять в работу" и "Закрыть"
supportBot.action(/ticket_(ack|close)_(.+)/, verifyAgent, async (ctx) => {
  const agent = (ctx as any).agent;
  const action = ctx.match[1];
  const ticketId = ctx.match[2];

  // --- НАЧАЛО ИСПРАВЛЕНИЯ ---
  // Явно проверяем, что исходное сообщение было текстовым
  const originalMessage = ctx.callbackQuery.message;
  if (!originalMessage || !('text' in originalMessage)) {
    await ctx.answerCbQuery(
      'Не удалось обработать: исходное сообщение не является текстом.',
      { show_alert: true },
    );
    return;
  }
  // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

  let newStatusName: string | undefined;
  let responseText = '';

  if (action === 'ack') {
    newStatusName = 'PENDING';
    responseText = `⏳ Тикет взят в работу агентом ${agent.name}`;
  } else if (action === 'close') {
    newStatusName = 'RESOLVED';
    responseText = `✅ Тикет закрыт агентом ${agent.name}`;
  }

  if (newStatusName) {
    const statusToSet = await prisma.ticketStatus.findUnique({
      where: { name: newStatusName },
    });
    if (!statusToSet) throw new Error(`Статус ${newStatusName} не найден в БД`);

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { statusId: statusToSet.id },
    });

    // Теперь TypeScript знает, что originalMessage.text существует
    await ctx.editMessageText(
      `${originalMessage.text}\n\n---\n<b>${responseText}</b>`,
      { parse_mode: 'HTML' },
    );
    await ctx.answerCbQuery('Статус тикета обновлен!');
  }
});

// Обработка кнопки "Отправить с почты..."
supportBot.action(/reply_(.+)_(.+)_(.+)/, verifyAgent, async (ctx) => {
  const agent = (ctx as any).agent;
  const fromEmail = ctx.match[1];
  const ticketId = ctx.match[2];
  const agentMessageId = BigInt(ctx.match[3]);

  const tempReply = await prisma.temporaryReply.findUnique({
    where: { agentMessageId },
  });

  if (!tempReply) {
    await ctx.editMessageText(
      '❌ Время сессии истекло, текст ответа утерян. Пожалуйста, попробуйте ответить на тикет заново.',
    );
    return ctx.answerCbQuery('Ошибка', { show_alert: true });
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
    text: tempReply.replyText,
    html: `<p>${tempReply.replyText.replace(/\n/g, '<br>')}</p>`,
  });

  const agentSenderType = await prisma.senderType.findUnique({
    where: { name: 'AGENT' },
  });
  if (!agentSenderType) throw new Error('SenderType AGENT не найден');

  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      content: tempReply.replyText,
      senderTypeId: agentSenderType.id,
      agentId: agent.id,
    },
  });

  await prisma.temporaryReply.delete({ where: { agentMessageId } });

  await ctx.editMessageText(
    `✅ Ответ успешно отправлен клиенту ${ticket.clientEmail} с почты <b>${fromEmail}</b>.`,
    { parse_mode: 'HTML' },
  );
  await ctx.answerCbQuery('Отправлено!');
});

// --- Глобальный Обработчик Ошибок ---
const handleBotError = (error: unknown, botName: string) => {
  console.error(`Ошибка в [${botName}]:`, error);
};
clientBot.catch((err, ctx) => handleBotError(err, 'ClientBot'));
supportBot.catch((err, ctx) => handleBotError(err, 'SupportBot'));

console.log('🤖 Telegraf-боты и их логика инициализированы...');
