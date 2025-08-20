// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import CredentialsProvider from 'next-auth/providers/credentials';
import TelegramBot from 'node-telegram-bot-api';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

// --- НАЧАЛО ИЗМЕНЕНИЙ: Инициализируем нашего "агента" ---
// Убедитесь, что токен есть в .env, иначе бот не сможет работать.
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env');
}
const bot = new TelegramBot(token);
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Наш новый "модуль" для Telegram ---
    CredentialsProvider({
      name: 'Telegram',
      credentials: {
        telegramId: { label: 'Telegram ID', type: 'text' },
      },
      // `authorize` — это сердце нашего "шпионского" метода.
      async authorize(credentials) {
        if (!credentials?.telegramId) {
          return null; // Если "позывной" не пришел, отбой.
        }
        const telegramId = credentials.telegramId;

        // 1. Ищем пользователя с таким "позывным" или создаем нового.
        let user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
          user = await prisma.user.create({ data: { telegramId } });
        }

        // 2. Генерируем "секретный пакет" (токен) для входа.
        const token = (await (
          await fetch(`${process.env.NEXTAUTH_URL}/api/auth/signin/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email || `${user.id}@telegram.user`,
            }), // Используем "служебный" email
          })
        ).json()) as { token: string };

        // 3. Создаем "волшебную ссылку".
        const url = new URL(
          `${process.env.NEXTAUTH_URL}/api/auth/callback/email`,
        );
        url.searchParams.set('token', token.token);
        url.searchParams.set('email', user.email || `${user.id}@telegram.user`);

        // 4. Отправляем приказ "агенту".
        await bot.sendMessage(
          telegramId,
          `Здравствуйте! Вот ваша ссылка для входа в Kyanchir Store:\n\n${url.toString()}`,
        );

        // 5. Возвращаем `null`, потому что авторизация произойдет только когда пользователь
        // нажмет на ссылку. Мы просто инициировали процесс.
        return null;
      },
    }),
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify-request',
    error: '/login/error',
  },
});

export { handler as GET, handler as POST };
