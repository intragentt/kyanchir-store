// Местоположение: src/app/api/auth/[...nextauth]/route.ts
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  // Используем адаптер v1, совместимый с next-auth v4
  adapter: PrismaAdapter(prisma),
  providers: [
    // Наш новый "Мастер Ключей" для входа через Telegram
    CredentialsProvider({
      // Имя этого провайдера. Мы будем использовать его на клиенте: signIn('telegram-credentials')
      id: 'telegram-credentials',
      name: 'Telegram Login',
      credentials: {
        // Определяем, какие данные мы ожидаем от клиента.
        // В нашем случае, это "активированный билет".
        token: { label: 'Login Token', type: 'text' },
      },
      // Самая главная функция - "Проверка билета"
      async authorize(credentials) {
        if (!credentials?.token) {
          return null; // Если билета нет, вход невозможен
        }

        // 1. Ищем "билет" в базе данных.
        const loginToken = await prisma.loginToken.findUnique({
          where: { token: credentials.token },
        });

        // 2. Проверяем, что билет существует, не просрочен и, самое главное,
        //    что наш "Бот-Привратник" уже привязал к нему пользователя!
        if (
          !loginToken ||
          !loginToken.userId ||
          loginToken.expires < new Date()
        ) {
          return null;
        }

        // 3. Если все проверки пройдены, находим пользователя по ID из билета.
        const user = await prisma.user.findUnique({
          where: { id: loginToken.userId },
        });

        // 4. Если пользователь найден, возвращаем его. Next-auth создаст для него сессию.
        //    Если нет - возвращаем null.
        return user || null;
      },
    }),

    // Старый добрый Email-провайдер остается без изменений
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
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify-request',
    error: '/login/error',
  },
  // Для кастомного провайдера необходимо указать session strategy
  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
