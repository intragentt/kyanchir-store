// Местоположение: /src/lib/telegramService.ts

import TelegramBot from 'node-telegram-bot-api';
import prisma from '@/lib/prisma';
import { AgentRole } from '@prisma/client';

const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;

if (!token) {
  throw new Error(
    'TELEGRAM_SUPPORT_BOT_TOKEN не найден в переменных окружения!',
  );
}

let botInstance: TelegramBot | null = null;

export const getBotInstance = (): TelegramBot => {
  if (!botInstance) {
    botInstance = new TelegramBot(token, { polling: false });
    console.log('🤖 Экземпляр админского Telegram-бота успешно создан.');
  }
  return botInstance;
};

export const setWebhook = async () => {
  const bot = getBotInstance();
  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram-support-webhook`;
  const secretToken = process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET;

  if (!secretToken) {
    console.warn(
      'TELEGRAM_SUPPORT_WEBHOOK_SECRET не установлен. Вебхук будет небезопасным.',
    );
  }

  try {
    await bot.setWebHook(webhookUrl, { secret_token: secretToken });
    console.log(
      `✅ Вебхук для админ-бота успешно установлен на URL: ${webhookUrl}`,
    );

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Устанавливаем команды-подсказки в меню Telegram
    await bot.setMyCommands([
      { command: '/start', description: 'Перезапустить и показать клавиатуру' },
      { command: '/tickets', description: 'Показать открытые тикеты' },
    ]);
    console.log('✅ Команды-подсказки для бота установлены.');
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  } catch (error) {
    console.error(
      '❌ Не удалось установить вебхук или команды для админ-бота:',
      error,
    );
  }
};

export const notifyAgents = async (
  ticket: {
    id: string;
    subject: string;
    clientEmail: string;
    assignedEmail: string | null;
  },
  assignedRole: AgentRole,
) => {
  const bot = getBotInstance();
  const agentsToNotify = await prisma.supportAgent.findMany({
    where: {
      telegramId: { not: null },
      OR: [{ role: assignedRole }, { role: AgentRole.ADMIN }],
    },
  });
  if (agentsToNotify.length === 0) {
    console.warn(
      `Нет агентов для уведомления о тикете ${ticket.id} с ролью ${assignedRole}`,
    );
    return;
  }
  const ticketUrl = `https://t.me/kyanchir_uw_maill_bot?start=ticket_${ticket.id}`;
  const messageText = `
📬 **Новое обращение!** (на ${ticket.assignedEmail || 'support'}) <a href="${ticketUrl}">&#8203;</a>
<b>От:</b> ${ticket.clientEmail}
<b>Тема:</b> ${ticket.subject}
<i>Чтобы ответить, используйте функцию "Ответить" (Reply) на это сообщение.</i>
  `;
  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: 'Взять в работу ⏳', callback_data: `ticket_ack_${ticket.id}` },
        {
          text: 'Закрыть тикет ✅',
          callback_data: `ticket_close_${ticket.id}`,
        },
      ],
      [
        {
          text: 'Посмотреть тикет на сайте ↗️',
          url: `${process.env.NEXTAUTH_URL}/admin/tickets/${ticket.id}`,
        },
      ],
    ],
  };

  for (const agent of agentsToNotify) {
    try {
      if (agent.telegramId) {
        await bot.sendMessage(agent.telegramId, messageText, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
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
};
