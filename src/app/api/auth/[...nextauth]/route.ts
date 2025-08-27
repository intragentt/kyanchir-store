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

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
