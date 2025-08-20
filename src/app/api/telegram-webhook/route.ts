// Местоположение: src/app/api/telegram-webhook/route.ts
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import prisma from '@/lib/prisma';

// --- Секреты ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const baseUrl = process.env.NEXTAUTH_URL;

export async function POST(request: Request) {
  // --- МАЯЧОК №1: Запрос получен ---
  console.log('--- Webhook received a request ---');

  try {
    if (!token || !webhookSecret || !baseUrl) {
      console.error('CRITICAL: Missing environment variables!');
      throw new Error('Telegram secrets or NEXTAUTH_URL are not defined');
    }

    const bot = new TelegramBot(token);

    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secret !== webhookSecret) {
      console.warn('Unauthorized access attempt: Invalid secret token.');
      return NextResponse.json({ status: 'Unauthorized' }, { status: 401 });
    }
    // --- МАЯЧОК №2: Секретный токен валиден ---
    console.log('Secret token is valid.');

    const body = await request.json();
    const message = body.message as TelegramBot.Message | undefined;

    if (!message) {
      console.log(
        'Request body did not contain a message. Exiting gracefully.',
      );
      return NextResponse.json({ status: 'OK' });
    }
    // --- МАЯЧОК №3: Сообщение успешно распарсено ---
    console.log(`Message received from chat ID: ${message.chat.id}`);

    const telegramId = message.chat.id.toString();

    // ... (логика для message.contact остается, она не критична сейчас) ...

    if (message.text?.startsWith('/start')) {
      // --- МАЯЧОК №4: Обработка команды /start ---
      console.log(`Processing /start command. Full text: "${message.text}"`);

      const loginToken = message.text.split(' ')[1];

      if (loginToken) {
        console.log(`Found login token: ${loginToken}`);
        // ... (логика для /start с токеном) ...
      } else {
        console.log('No login token found, sending welcome message.');
        const welcomeText =
          'Добро пожаловать в Kyanchir Store!\n\nЧтобы войти на сайт, нажмите кнопку ниже.';

        // --- МАЯЧОК №5: Попытка отправить сообщение ---
        console.log(`Attempting to send welcome message to ${telegramId}`);
        await bot.sendMessage(telegramId, welcomeText, {
          reply_markup: {
            keyboard: [
              [{ text: 'Войти на сайт', web_app: { url: `${baseUrl}/login` } }],
              [{ text: '📱 Поделиться номером', request_contact: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
        // --- МАЯЧОК №6: Сообщение успешно отправлено ---
        console.log('Welcome message sent successfully.');
      }
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error: any) {
    // --- МАЯЧОК ОШИБКИ: Ловим и записываем абсолютно все ---
    console.error('!!! --- FATAL WEBHOOK ERROR --- !!!');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    return NextResponse.json({ status: 'Error' }, { status: 500 });
  }
}
