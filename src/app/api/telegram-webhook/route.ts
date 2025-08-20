// Местоположение: src/app/api/telegram-webhook/route.ts
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import prisma from '@/lib/prisma';

// --- Секреты ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const baseUrl = process.env.NEXTAUTH_URL;

if (!token || !webhookSecret || !baseUrl) {
  throw new Error('Telegram secrets or NEXTAUTH_URL are not defined in .env');
}

const bot = new TelegramBot(token);

// Это наш "слушающий пост". Он будет принимать POST-запросы от Telegram.
export async function POST(request: Request) {
  try {
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secret !== webhookSecret) {
      return NextResponse.json({ status: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const message = body.message as TelegramBot.Message | undefined;

    if (!message) {
      return NextResponse.json({ status: 'OK' });
    }

    const telegramId = message.chat.id.toString();

    // --- СЦЕНАРИЙ 1: Пользователь поделился контактом ---
    if (message.contact) {
      const phone = message.contact.phone_number;

      // Находим или создаем пользователя и сохраняем его номер телефона
      await prisma.user.upsert({
        where: { telegramId },
        update: { phone },
        create: {
          telegramId,
          phone,
          name: message.from?.first_name || 'Telegram User',
        },
      });

      // Благодарим и убираем клавиатуру
      await bot.sendMessage(telegramId, '✅ Спасибо! Ваш номер сохранен.', {
        reply_markup: {
          remove_keyboard: true,
        },
      });

      return NextResponse.json({ status: 'OK' });
    }

    // --- СЦЕНАРИЙ 2: Пользователь отправил команду /start ---
    if (message.text?.startsWith('/start')) {
      const loginToken = message.text.split(' ')[1];

      // --- ПОДСЦЕНАРИЙ 2.1: Пользователь пришел с "билетом" для входа ---
      if (loginToken) {
        const tokenInDb = await prisma.loginToken.findUnique({
          where: { token: loginToken, expires: { gt: new Date() } },
        });

        if (tokenInDb) {
          // "Билет" действителен!
          const user = await prisma.user.upsert({
            where: { telegramId },
            update: {},
            create: { telegramId, name: message.from?.first_name },
          });

          await prisma.loginToken.update({
            where: { id: tokenInDb.id },
            data: { userId: user.id },
          });

          // Сообщаем об успехе и просим номер телефона
          const successText =
            '✅ Отлично! Ваш вход подтвержден.\n\nТеперь можете вернуться на сайт.\n\nДля удобства будущих заказов, пожалуйста, поделитесь вашим номером телефона.';

          await bot.sendMessage(telegramId, successText, {
            reply_markup: {
              keyboard: [
                [{ text: '📱 Поделиться номером', request_contact: true }],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          });
        } else {
          // "Билет" недействителен или устарел
          await bot.sendMessage(
            telegramId,
            '⚠️ Упс! Ссылка для входа недействительна или ее срок действия истек. Пожалуйста, вернитесь на сайт и попробуйте снова.',
            {
              reply_markup: {
                remove_keyboard: true,
              },
            },
          );
        }
      } else {
        // --- ПОДСЦЕНАРИЙ 2.2: Пользователь просто запустил бота ---
        const welcomeText =
          'Добро пожаловать в Kyanchir Store!\n\nЧтобы войти на сайт, нажмите кнопку ниже. А для удобства будущих заказов, пожалуйста, поделитесь вашим номером телефона.';

        await bot.sendMessage(telegramId, welcomeText, {
          reply_markup: {
            keyboard: [
              [
                {
                  text: 'Войти на сайт',
                  web_app: { url: `${baseUrl}/login` },
                },
              ],
              [{ text: '📱 Поделиться номером', request_contact: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
      }
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Избегаем отправки ошибки в Telegram, чтобы не попасть в цикл
    return NextResponse.json({ status: 'Error' }, { status: 500 });
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
