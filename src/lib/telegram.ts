import { Telegraf, Context, Markup } from 'telegraf';
import crypto from 'crypto';
import { addMinutes } from 'date-fns';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { encrypt } from '@/lib/encryption';

const AGENT_KEYBOARD = Markup.keyboard([
  ['📝 Открытые тикеты'],
  ['🆘 Помощь'],
]).resize();

const TELEGRAM_CHANNEL_URL = 'https://t.me/kyanchiruw';

const NEW_USER_KEYBOARD = Markup.keyboard([
  [Markup.button.contactRequest('💖 Принять и поделиться контактом')],
])
  .resize()
  .oneTime();

const LOGGED_IN_MENU_KEYBOARD = Markup.keyboard([
  ['🛍️ Каталог', '💖 Мой аккаунт'],
  ['💌 Мои заказы'],
  ['🧚‍♀️ Помощь и поддержка', '✨ Частые вопросы'],
  ['🔑 Получить ссылку для входа'],
]).resize();

const pendingLoginTokens = new Map<string, string>();

function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    return digits;
  }
  if (digits.startsWith('8') && digits.length === 11) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.startsWith('7') && digits.length === 11) {
    return `+${digits}`;
  }
  return digits.startsWith('+') ? digits : `+${digits}`;
}

async function sendLoginLink(
  ctx: Context,
  user: { id: string },
  baseUrl: string,
  options?: { introKey?: 'firstTime' | 'refresh' },
) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = addMinutes(new Date(), 5);

  await prisma.loginToken.create({
    data: {
      token,
      expires,
      userId: user.id,
    },
  });

  const introTextMap: Record<'firstTime' | 'refresh', string> = {
    firstTime:
      'Выберите, где удобнее продолжить: мини-приложение или сайт. Ссылка активна примерно 5 минут ✨',
    refresh:
      'Вот новая безопасная ссылка. Она тоже будет активна около 5 минут — используйте её скорее ✨',
  };

  const message = introTextMap[options?.introKey ?? 'refresh'];
  const loginUrl = `${baseUrl.replace(/\/?$/, '')}/login?token=${token}`;
  const webAppUrl = `${baseUrl.replace(/\/?$/, '')}?token=${token}`;

  await ctx.replyWithHTML(message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '✨ Открыть Mini App',
            web_app: { url: webAppUrl },
          },
        ],
        [
          {
            text: '🌐 Перейти на сайт',
            url: loginUrl,
          },
        ],
        [
          {
            text: '🔄 Создать ссылку заново',
            callback_data: 'regenerate_login_link',
          },
        ],
      ],
    },
  });
}

async function promptForContact(ctx: Context) {
  await ctx.replyWithHTML(
    'Чтобы защитить ваш аккаунт, поделитесь номером телефона кнопкой ниже.',
    NEW_USER_KEYBOARD,
  );
}

async function processPendingToken(
  ctx: Context,
  loginToken: string,
  user: { id: string; phone?: string | null } | null,
  baseUrl: string,
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  if (!user || !user.phone) {
    pendingLoginTokens.set(String(telegramId), loginToken);
    await ctx.reply(
      'Нашла ваш запрос! Поделитесь контактом, и я завершу вход автоматически 💖',
      NEW_USER_KEYBOARD,
    );
    return;
  }

  const tokenRecord = await prisma.loginToken.findUnique({
    where: { token: loginToken },
  });

  if (!tokenRecord) {
    pendingLoginTokens.delete(String(telegramId));
    await ctx.reply(
      'Не удалось найти эту ссылку. Вернитесь на сайт и создайте новую, пожалуйста.',
    );
    return;
  }

  if (new Date(tokenRecord.expires) < new Date()) {
    pendingLoginTokens.delete(String(telegramId));
    await ctx.reply(
      'Ссылка уже истекла. Запросите новую на сайте — я буду ждать здесь ✨',
    );
    return;
  }

  await prisma.loginToken.update({
    where: { token: loginToken },
    data: { userId: user.id },
  });

  pendingLoginTokens.delete(String(telegramId));

  await ctx.replyWithHTML(
    '✨ Готово! Возвращайтесь на сайт Kyanchir и завершите вход — дверь уже открыта.',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть магазин',
              url: `${baseUrl.replace(/\/?$/, '')}/login`,
            },
          ],
          [
            {
              text: 'Наш уютный канал ✨',
              url: TELEGRAM_CHANNEL_URL,
            },
          ],
        ],
      },
    },
  );
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Критическая ошибка: ${name} не определен.`);
  }
  return value;
}

const handleBotError = (error: unknown, botName: string) => {
  console.error(`Ошибка в [${botName}]:`, error);
};

let clientBotInstance: Telegraf<Context> | null = null;
let supportBotInstance: Telegraf<Context> | null = null;

function setupClientBot(bot: Telegraf<Context>, baseUrl: string) {
  bot.command('start', async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        return;
      }

      const loginToken = ctx.payload?.trim();
      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });

      if (loginToken) {
        await ctx.reply('Проверяю магическую ссылку...');
        await processPendingToken(ctx, loginToken, user, baseUrl);
        return;
      }

      if (!user || !user.phone) {
        await ctx.replyWithHTML(
          'Привет! Я ваш гид по Kyanchir. Нажмите кнопку ниже, чтобы поделиться контактом и открыть доступ к магазину ✨',
          NEW_USER_KEYBOARD,
        );
        return;
      }

      await ctx.reply(
        `Снова привет, ${ctx.from.first_name || 'друг'}! Чем могу помочь сегодня?`,
        LOGGED_IN_MENU_KEYBOARD,
      );
      await ctx.reply(
        'Нужно войти на сайте? Нажмите «🔑 Получить ссылку для входа», и я всё подготовлю.',
      );
    } catch (error) {
      handleBotError(error, 'ClientBot');
      await ctx.reply('Что-то пошло не так. Попробуйте ещё раз чуть позже.');
    }
  });

  bot.on('contact', async (ctx) => {
    try {
      const contact = ctx.message?.contact;
      const telegramId = ctx.from?.id;

      if (!contact || !telegramId) {
        return;
      }

      if (contact.user_id !== telegramId) {
        await ctx.reply('Пожалуйста, отправьте свой контакт, а не чужой.');
        return;
      }

      const phone = normalizePhoneNumber(contact.phone_number);
      const encryptedPhone = encrypt(phone);
      const encryptedName =
        (contact.first_name || ctx.from?.first_name)
          ? encrypt(contact.first_name || ctx.from!.first_name)
          : null;

      const user = await prisma.user.upsert({
        where: { telegramId: String(telegramId) },
        update: {
          phone: encryptedPhone,
          ...(encryptedName ? { name_encrypted: encryptedName } : {}),
        },
        create: {
          telegramId: String(telegramId),
          phone: encryptedPhone,
          ...(encryptedName ? { name_encrypted: encryptedName } : {}),
          role: {
            connect: { name: 'USER' },
          },
        },
      });

      await ctx.reply(
        'Спасибо! Контакт сохранён. Сейчас пришлю свежую ссылку для входа 💌',
        LOGGED_IN_MENU_KEYBOARD,
      );

      const pendingToken = pendingLoginTokens.get(String(telegramId));
      if (pendingToken) {
        await ctx.reply('Подтверждаю ваш запрос со страницы входа...');
        await processPendingToken(ctx, pendingToken, user, baseUrl);
      } else {
        await sendLoginLink(ctx, user, baseUrl, { introKey: 'firstTime' });
        await ctx.reply(
          'А ещё у нас есть уютный канал. Заглядывайте, чтобы вдохновиться новинками ✨',
          Markup.inlineKeyboard([
            [
              {
                text: 'Перейти в канал',
                url: TELEGRAM_CHANNEL_URL,
              },
            ],
          ]),
        );
      }
    } catch (error) {
      handleBotError(error, 'ClientBot');
      await ctx.reply(
        'Не удалось сохранить контакт. Попробуйте ещё раз или напишите в поддержку.',
      );
    }
  });

  bot.hears('🔑 Получить ссылку для входа', async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;
      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });
      if (!user || !user.phone) {
        await promptForContact(ctx);
        return;
      }
      await sendLoginLink(ctx, user, baseUrl);
    } catch (error) {
      handleBotError(error, 'ClientBot');
      await ctx.reply('Не удалось создать ссылку. Попробуйте снова чуть позже.');
    }
  });

  bot.action('regenerate_login_link', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const telegramId = ctx.from?.id;
      if (!telegramId) return;
      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });
      if (!user || !user.phone) {
        await promptForContact(ctx);
        return;
      }
      await sendLoginLink(ctx, user, baseUrl);
    } catch (error) {
      handleBotError(error, 'ClientBot');
      await ctx.answerCbQuery('Не получилось создать ссылку, попробуйте позже.', {
        show_alert: true,
      });
    }
  });

  bot.hears('🛍️ Каталог', async (ctx) => {
    await ctx.reply('Открываю витрину Kyanchir ✨', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Перейти в каталог',
              web_app: { url: baseUrl.replace(/\/?$/, '') },
            },
          ],
        ],
      },
    });
  });

  bot.hears('💖 Мой аккаунт', async (ctx) => {
    await ctx.reply(
      'Чтобы управлять аккаунтом, я подготовлю ссылку на личный кабинет ✨',
    );
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    const user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });
    if (!user || !user.phone) {
      await promptForContact(ctx);
      return;
    }
    await sendLoginLink(ctx, user, baseUrl);
  });

  bot.hears('💌 Мои заказы', async (ctx) => {
    await ctx.reply(
      'Ссылку на ваши заказы можно получить через личный кабинет. Создать новую?',
    );
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    const user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });
    if (!user || !user.phone) {
      await promptForContact(ctx);
      return;
    }
    await sendLoginLink(ctx, user, baseUrl);
  });

  bot.hears('🧚‍♀️ Помощь и поддержка', async (ctx) => {
    await ctx.reply(
      'Наша фея поддержки всегда на связи: напишите @kyanchir_support или воспользуйтесь формой на сайте 💌',
    );
  });

  bot.hears('✨ Частые вопросы', async (ctx) => {
    await ctx.reply(
      'Скоро здесь появится раздел с ответами на самые популярные вопросы. А пока загляните на сайт ✨',
    );
  });

  bot.on('message', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });

    if (!user || !user.phone) {
      await promptForContact(ctx);
      return;
    }

    if ('text' in ctx.message) {
      await ctx.reply(
        'Я пока понимаю только кнопки на клавиатуре. Попробуйте воспользоваться ими 💖',
        LOGGED_IN_MENU_KEYBOARD,
      );
    }
  });

  bot.catch((err) => handleBotError(err, 'ClientBot'));
}

function setupSupportBot(bot: Telegraf<Context>) {
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

  bot.command('start', verifyAgent, async (ctx) => {
    await ctx.reply(
      `👋 Добро пожаловать, ${(ctx as any).agent.name}! Готовы к работе.`,
      AGENT_KEYBOARD,
    );
  });

  const handleTicketsRequest = async (ctx: Context) => {
    await ctx.reply('⏳ Загружаю список открытых тикетов...');
  };
  bot.command('tickets', verifyAgent, handleTicketsRequest);
  bot.hears('📝 Открытые тикеты', verifyAgent, handleTicketsRequest);

  bot.on('message', verifyAgent, async (ctx) => {
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

  bot.action(/ticket_(ack|close)_(.+)/, verifyAgent, async (ctx) => {
    const agent = (ctx as any).agent;
    const action = ctx.match[1];
    const ticketId = ctx.match[2];
    const originalMessage = ctx.callbackQuery.message;

    if (!originalMessage || !('text' in originalMessage)) {
      await ctx.answerCbQuery(
        'Не удалось обработать: исходное сообщение не является текстом.',
        { show_alert: true },
      );
      return;
    }

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

      await ctx.editMessageText(
        `${originalMessage.text}\n\n---\n<b>${responseText}</b>`,
        { parse_mode: 'HTML' },
      );
      await ctx.answerCbQuery('Статус тикета обновлен!');
    }
  });

  bot.action(/reply_(.+)_(.+)_(.+)/, verifyAgent, async (ctx) => {
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

  bot.catch((err) => handleBotError(err, 'SupportBot'));
}

export function getClientBot(): Telegraf<Context> {
  if (!clientBotInstance) {
    const token = getRequiredEnv('TELEGRAM_BOT_TOKEN');
    const baseUrl = getRequiredEnv('NEXTAUTH_URL');
    clientBotInstance = new Telegraf(token);
    setupClientBot(clientBotInstance, baseUrl);
    console.log('🤖 ClientBot инициализирован.');
  }
  return clientBotInstance;
}

export function getSupportBot(): Telegraf<Context> {
  if (!supportBotInstance) {
    const token = getRequiredEnv('TELEGRAM_SUPPORT_BOT_TOKEN');
    supportBotInstance = new Telegraf(token);
    setupSupportBot(supportBotInstance);
    console.log('🤖 SupportBot инициализирован.');
  }
  return supportBotInstance;
}
