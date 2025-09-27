// Местоположение: src/app/api/telegram-webhook/route.ts
// МОДЕРНИЗИРОВАННАЯ ВЕРСИЯ

import { NextResponse } from 'next/server';
import { clientBot } from '@/lib/telegram'; // <-- ИЗМЕНЕНО: Импортируем наш Telegraf-бот

const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(request: Request) {
  console.log('--- [Client Bot Webhook] Received a request ---');

  try {
    // 1. Проверяем секретный токен. Это наша первая линия защиты.
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secret !== webhookSecret) {
      console.warn(
        '[Client Bot] Unauthorized access attempt: Invalid secret token.',
      );
      return NextResponse.json({ status: 'Unauthorized' }, { status: 401 });
    }
    console.log('[Client Bot] Secret token is valid.');

    // 2. Получаем тело запроса от Telegram.
    const body = await request.json();
    console.log('[Client Bot] Received Update:', JSON.stringify(body, null, 2));

    // 3. Передаем все обновление на обработку в Telegraf.
    // Telegraf сам разберется, что это было, и вызовет нужный обработчик,
    // который мы определим в /lib/telegram.ts
    await clientBot.handleUpdate(body);

    // 4. Отвечаем Telegram, что все в порядке.
    return NextResponse.json({ status: 'OK' });
  } catch (error: any) {
    console.error('!!! --- [Client Bot Webhook] FATAL WEBHOOK ERROR --- !!!');
    console.error('Error Message:', error.message);
    return NextResponse.json({ status: 'Error' }, { status: 500 });
  }
}
