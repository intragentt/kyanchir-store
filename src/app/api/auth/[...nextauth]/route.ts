// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createTransport } from 'nodemailer';

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'telegram-credentials',
      name: 'Telegram Login',
      credentials: { token: { label: 'Login Token', type: 'text' } },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const loginToken = await prisma.loginToken.findUnique({
          where: { token: credentials.token },
        });
        if (
          !loginToken ||
          !loginToken.userId ||
          loginToken.expires < new Date()
        )
          return null;
        const user = await prisma.user.findUnique({
          where: { id: loginToken.userId },
        });
        return user || null;
      },
    }),

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
      generateVerificationToken: async () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      sendVerificationRequest: async ({
        identifier: email,
        url,
        token,
        provider,
      }) => {
        // --- НАЧАЛО ИЗМЕНЕНИЙ (ДИАГНОСТИКА) ---
        console.log('--- НАЧАЛО ДИАГНОСТИКИ ОТПРАВКИ EMAIL ---');
        console.log(`Цель: ${email}`);
        console.log(
          `Хост: ${process.env.EMAIL_SERVER_HOST}, Порт: ${process.env.EMAIL_SERVER_PORT}`,
        );
        console.log(`Пользователь: ${process.env.EMAIL_SERVER_USER}`);

        try {
          const transport = createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
            // Добавляем опции для отладки
            debug: true,
            logger: true,
          });

          console.log('Транспорт создан. Начинаю отправку...');

          const result = await transport.sendMail({
            to: email,
            from: provider.from,
            subject: `Ваш код для входа в Kyanchir`,
            html: `<div>Ваш код: ${token}</div>`, // Упрощаем HTML для теста
          });

          console.log('Письмо успешно отправлено! Результат:', result);
        } catch (error) {
          // Если есть ЛЮБАЯ ошибка, мы ОБЯЗАНЫ увидеть ее в логах Vercel
          console.error('!!! КРИТИЧЕСКАЯ ОШИБКА ПРИ ОТПРАВКЕ EMAIL:', error);
          // Выбрасываем ошибку, чтобы Vercel точно ее залогировал как 500
          throw new Error('Не удалось отправить email. Смотри логи функции.');
        } finally {
          console.log('--- КОНЕЦ ДИАГНОСТИКИ ОТПРАВКИ EMAIL ---');
        }
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login/error',
  },
  session: {
    strategy: 'database',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
