// Местоположение: /src/app/api/telegram-support-webhook/route.ts

import { NextResponse } from 'next/server';
import { getBotInstance, setWebhook } from '@/lib/telegramService';
import prisma from '@/lib/prisma';
import TelegramBot from 'node-telegram-bot-api';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

// Вызываем бота и устанавливаем вебхук ОДИН РАЗ при старте сервера.
const bot = getBotInstance();
setWebhook();

// Обработчик команды /start: верификация и регистрация агента
async function handleStartCommand(msg: TelegramBot.Message) {
  if (!msg.from) return;

  const { id: telegramId, username, first_name: firstName } = msg.from;
  const chatId = msg.chat.id;

  // 1. Проверяем, есть ли уже такой агент в нашей базе по ID
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

  // 2. Если агента нет, ищем его в "белом списке" по username, но без привязанного ID
  const potentialAgent = await prisma.supportAgent.findFirst({
    where: {
      internalUsername: username,
      telegramId: null, // Ищем только тех, кто еще не привязал свой аккаунт
    },
  });

  if (!potentialAgent) {
    await bot.sendMessage(
      chatId,
      `❌ Здравствуйте, ${firstName}. К сожалению, вас нет в списке верифицированных сотрудников. Доступ запрещен.`,
    );
    return;
  }

  // 3. Агент найден! Привязываем его telegramId к записи в базе.
  const updatedAgent = await prisma.supportAgent.update({
    where: { id: potentialAgent.id },
    data: { telegramId: String(telegramId) },
  });

  await bot.sendMessage(
    chatId,
    `🎉 Добро пожаловать, ${updatedAgent.name}! Ваш аккаунт успешно верифицирован. Теперь вы будете получать уведомления о новых тикетах.`,
  );
}

// Главная функция-диспетчер, которая принимает все вебхуки от Telegram
export async function POST(req: Request) {
  // Проверяем секретный заголовок для безопасности
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (secretToken !== process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET) {
    console.warn('Получен запрос с неверным секретным токеном для админ-бота.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const msg = body.message as TelegramBot.Message | undefined;

    // Игнорируем обновления, которые не являются текстовыми сообщениями
    if (!msg || !msg.text) {
      return NextResponse.json({ message: 'Update is not a message' });
    }

    // --- Маршрутизация команд ---
    if (msg.text.startsWith('/start')) {
      await handleStartCommand(msg);
    } else if (msg.reply_to_message) {
      // TODO: Здесь будет логика ответа на тикет
      await bot.sendMessage(
        msg.chat.id,
        `(Заглушка) Вы ответили на сообщение. Скоро здесь будет логика отправки ответа клиенту.`,
      );
    } else {
      // Ответ на любое другое сообщение, не являющееся командой или ответом
      await bot.sendMessage(
        msg.chat.id,
        'Для начала работы введите команду /start',
      );
    }

    // Сообщаем Telegram, что мы все получили и обработали
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка в обработчике вебхука админ-бота:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
