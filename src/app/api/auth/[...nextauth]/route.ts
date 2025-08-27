// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createTransport } from 'nodemailer';

export const authOptions: NextAuthOptions = {
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

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---

    // Провайдер №2: Наш новый "Специалист по Верификации Кодов".
    // Именно он будет обрабатывать финальный шаг входа по email.
    CredentialsProvider({
      // 1. Уникальный ID, чтобы клиент знал, какой именно рецепт использовать.
      id: 'email-code',
      name: 'Email Code Verification',
      // 2. Определяем, какие "ингредиенты" он ожидает получить.
      credentials: {
        email: { label: 'Email', type: 'text' },
        token: { label: 'Verification Code', type: 'text' },
      },
      // 3. Самая главная часть - "Рецепт Приготовления" (логика авторизации).
      async authorize(credentials) {
        // Проверяем, что все нужные данные пришли.
        if (!credentials?.email || !credentials?.token) {
          return null;
        }

        // Ищем в базе данных токен, который соответствует этому email.
        // next-auth по умолчанию хранит токены верификации в таблице VerificationToken.
        const verificationToken = await prisma.verificationToken.findFirst({
          where: { identifier: credentials.email },
        });

        // Если токена нет, или он не совпадает с присланным, или его срок годности истек - отказываем.
        if (
          !verificationToken ||
          verificationToken.token !== credentials.token ||
          verificationToken.expires < new Date()
        ) {
          // Для безопасности можно добавить логику подсчета попыток здесь, если потребуется.
          return null;
        }

        // Если токен верный, находим пользователя по email.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Если пользователь найден, мы возвращаем его.
        // Next-Auth увидит это и автоматически создаст сессию (установит cookie).
        // Это и есть наша цель!
        return user;
      },
    }),

    // Этот провайдер теперь НИЧЕГО НЕ ДЕЛАЕТ. Он просто здесь, чтобы next-auth не ругался.
    // Всю работу по отправке и проверке мы делаем в наших кастомных API.
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      // Пустая функция, чтобы он не пытался ничего генерировать
      generateVerificationToken: async () => {
        return '';
      },
      // Пустая функция, чтобы он не пытался ничего отправлять
      sendVerificationRequest: async ({
        identifier: email,
        url,
        token,
        provider,
      }) => {
        return;
      },
    }),
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    // Добавляем коллбэк, чтобы убедиться, что id пользователя попадает в JWT токен.
    // Это стандартная практика для JWT стратегии.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Добавляем коллбэк, чтобы id из токена попадал в объект сессии на клиенте.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
