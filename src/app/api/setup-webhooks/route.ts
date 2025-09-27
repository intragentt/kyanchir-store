// Местоположение: /src/app/api/setup-webhooks/route.ts
// ВРЕМЕННЫЙ ФАЙЛ! Его нужно удалить после одного успешного использования.

import { NextResponse } from 'next/server';
import { clientBot, supportBot } from '@/lib/telegram';

// Мы используем GET, так как это проще всего вызвать из строки браузера.
export async function GET(request: Request) {
  try {
    // --- 1. Безопасность ---
    // Проверяем секретный ключ, чтобы никто посторонний не мог вызвать этот эндпоинт.
    // Мы используем CRON_SECRET, так как он уже есть и подходит для внутренних задач.
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      console.warn('Unauthorized attempt to set webhooks!');
      return NextResponse.json({ status: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      throw new Error('Критическая ошибка: NEXTAUTH_URL не определен в .env');
    }

    const results = [];

    // --- 2. Установка Вебхука для Бота Поддержки ---
    try {
      const supportWebhookUrl = `${baseUrl}/api/webhooks/telegram/support`;
      await supportBot.telegram.setWebhook(supportWebhookUrl, {
        secret_token: process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET,
      });
      results.push({
        bot: 'SupportBot',
        status: '✅ SUCCESS',
        url: supportWebhookUrl,
      });
      console.log(`✅ Вебхук для SupportBot успешно установлен!`);
    } catch (error) {
      console.error('❌ Ошибка установки вебхука для SupportBot:', error);
      results.push({
        bot: 'SupportBot',
        status: '❌ FAILED',
        error: (error as Error).message,
      });
    }

    // --- 3. Установка Вебхука для Клиентского Бота (Python) ---
    // Несмотря на то, что логика этого бота на Python, вебхук мы можем
    // установить отсюда, так как у нас есть его токен.
    try {
      const clientWebhookUrl = `${baseUrl}/api/telegram-webhook`; // Старый URL, который ожидает Python-бот
      await clientBot.telegram.setWebhook(clientWebhookUrl, {
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      });
      results.push({
        bot: 'ClientBot',
        status: '✅ SUCCESS',
        url: clientWebhookUrl,
      });
      console.log(`✅ Вебхук для ClientBot успешно установлен!`);
    } catch (error) {
      console.error('❌ Ошибка установки вебхука для ClientBot:', error);
      results.push({
        bot: 'ClientBot',
        status: '❌ FAILED',
        error: (error as Error).message,
      });
    }

    // --- 4. Отчет ---
    return NextResponse.json({
      message: 'Процесс установки вебхуков завершен.',
      results,
    });
  } catch (error) {
    console.error('!!! --- КРИТИЧЕСКАЯ ОШИБКА в setup-webhooks --- !!!', error);
    return NextResponse.json(
      { status: 'Error', message: (error as Error).message },
      { status: 500 },
    );
  }
}