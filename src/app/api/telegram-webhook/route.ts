// Местоположение: src/app/api/telegram-webhook/route.ts
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import prisma from '@/lib/prisma';
import { addMinutes } from 'date-fns'; // Понадобится для установки срока годности "билета"

// --- Секреты ---
const token = process.env.TELEGRAM_BOT_TOKEN;
// Секретный путь, чтобы никто другой не мог отправлять нам запросы.
// Добавьте эту переменную в ваш .env файл!
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !webhookSecret) {
  throw new Error('Telegram secrets are not defined in .env');
}

// Инициализируем нашего "агента".
const bot = new TelegramBot(token);

// Это наш "слушающий пост". Он будет принимать POST-запросы от Telegram.
export async function POST(request: Request) {
  try {
    // Проверяем "секретное слово", чтобы убедиться, что это действительно Telegram.
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secret !== webhookSecret) {
      return NextResponse.json({ status: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const message = body.message as TelegramBot.Message | undefined;

    // --- ГЛАВНАЯ ЛОГИКА "АКТИВАЦИИ БИЛЕТА" ---
    if (message?.text?.startsWith('/start')) {
      const loginToken = message.text.split(' ')[1]; // Извлекаем номер "билета"
      const telegramId = message.chat.id.toString();

      if (loginToken) {
        // Находим "билет" в нашей "кассе".
        const tokenInDb = await prisma.loginToken.findUnique({
          where: { token: loginToken, expires: { gt: new Date() } }, // Он должен быть не просрочен
        });

        if (tokenInDb) {
          // Находим или создаем пользователя с таким "позывным".
          const user = await prisma.user.upsert({
            where: { telegramId },
            update: {},
            create: { telegramId, name: message.from?.first_name },
          });

          // "Активируем билет": привязываем его к пользователю.
          await prisma.loginToken.update({
            where: { id: tokenInDb.id },
            data: { userId: user.id },
          });

          // Отправляем пользователю подтверждение.
          await bot.sendMessage(
            telegramId,
            '✅ Отлично! Вы успешно вошли. Теперь можете вернуться на сайт.',
          );
        } else {
          await bot.sendMessage(
            telegramId,
            '⚠️ Ссылка для входа недействительна или устарела. Попробуйте еще раз.',
          );
        }
      }
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ status: 'Error' }, { status: 500 });
  }
}
