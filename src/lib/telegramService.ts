// Местоположение: /src/lib/telegramService.ts

import TelegramBot from 'node-telegram-bot-api';
import prisma from '@/lib/prisma'; // Добавлен импорт prisma
import { AgentRole } from '@prisma/client'; // Добавлен импорт AgentRole

const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;

// Проверяем, что токен вообще существует
if (!token) {
  throw new Error(
    'TELEGRAM_SUPPORT_BOT_TOKEN не найден в переменных окружения!',
  );
}

let botInstance: TelegramBot | null = null;

/**
 * Инициализирует и возвращает синглтон-экземпляр бота.
 */
export const getBotInstance = (): TelegramBot => {
  if (!botInstance) {
    botInstance = new TelegramBot(token, { polling: false });
    console.log('🤖 Экземпляр админского Telegram-бота успешно создан.');
  }
  return botInstance;
};

/**
 * Устанавливает вебхук для бота.
 */
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
    await bot.setWebHook(webhookUrl, {
      secret_token: secretToken,
    });
    console.log(
      `✅ Вебхук для админ-бота успешно установлен на URL: ${webhookUrl}`,
    );
  } catch (error) {
    console.error('❌ Не удалось установить вебхук для админ-бота:', error);
  }
};

// --- НАЧАЛО ИЗМЕНЕНИЙ: НОВАЯ ФУНКЦИЯ ---
/**
 * Отправляет уведомления о новом тикете или сообщении всем агентам с нужной ролью.
 */
export const notifyAgents = async (
  ticket: { id: string; subject: string; clientEmail: string },
  assignedRole: AgentRole,
) => {
  const bot = getBotInstance();

  // 1. Находим всех агентов, у которых есть telegramId и нужная роль (или роль ADMIN)
  const agentsToNotify = await prisma.supportAgent.findMany({
    where: {
      telegramId: { not: null }, // У агента должен быть привязан Telegram
      OR: [
        { role: assignedRole }, // Уведомляем агентов с назначенной ролью
        { role: AgentRole.ADMIN }, // Админы получают все уведомления
      ],
    },
  });

  if (agentsToNotify.length === 0) {
    console.warn(
      `Нет агентов для уведомления о тикете ${ticket.id} с ролью ${assignedRole}`,
    );
    return;
  }

  // 2. Формируем сообщение
  // "Прячем" ID тикета в скрытую ссылку. Это трюк, чтобы потом извлечь его при ответе.
  const ticketUrl = `https://t.me/kyanchir_uw_maill_bot?start=ticket_${ticket.id}`;
  const messageText = `
📬 **Новое обращение!** <a href="${ticketUrl}">&#8203;</a>

<b>От:</b> ${ticket.clientEmail}
<b>Тема:</b> ${ticket.subject}

<i>Чтобы ответить, используйте функцию "Ответить" (Reply) на это сообщение.</i>
  `;

  // 3. Рассылаем уведомление каждому агенту
  for (const agent of agentsToNotify) {
    try {
      if (agent.telegramId) {
        await bot.sendMessage(agent.telegramId, messageText, {
          parse_mode: 'HTML',
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
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
