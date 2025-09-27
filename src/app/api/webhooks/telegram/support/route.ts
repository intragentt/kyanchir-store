// Местоположение: /src/app/api/webhooks/telegram/support/route.ts
// Новая, единственно верная точка входа для вебхуков Бота Поддержки.

import { NextResponse } from 'next/server';
import { supportBot } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    // 1. Получаем тело запроса от Telegram.
    const body = await request.json();

    // 2. Для отладки: выводим в консоль полученное обновление.
    // Это невероятно полезно для понимания того, что именно присылает Telegram.
    console.log(
      '--- [Support Bot Webhook] Received Update ---',
      JSON.stringify(body, null, 2),
    );

    // 3. Главная магия Telegraf: передаем все обновление на обработку.
    // Telegraf сам разберется, что это было - команда, нажатие кнопки или сообщение,
    // и вызовет нужный обработчик, который мы определим позже.
    await supportBot.handleUpdate(body);

    // 4. Отвечаем Telegram, что все в порядке, чтобы он не слал обновление повторно.
    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error(
      '!!! --- [Support Bot Webhook] CRITICAL ERROR --- !!!',
      error,
    );

    // 5. В случае критической ошибки, возвращаем статус 500,
    // чтобы Telegram, возможно, попробовал прислать обновление еще раз.
    return NextResponse.json(
      { status: 'Error', message: (error as Error).message },
      { status: 500 },
    );
  }
}

// ВАЖНО: Мы намеренно не добавляем сюда сложную бизнес-логику.
// Этот файл - просто "адаптер" между Next.js и Telegraf.
// Вся логика команд (/start, /tickets) и обработки кнопок
// будет добавлена в наш "центр управления" - /lib/telegram.ts.
