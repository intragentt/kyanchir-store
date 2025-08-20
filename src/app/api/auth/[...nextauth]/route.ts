// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Используем правильное имя импорта ---
import Telegram from 'next-auth/providers/telegram';
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
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем правильное имя провайдера ---
    Telegram({
      clientId: process.env.TELEGRAM_BOT_USERNAME,
      clientSecret: process.env.TELEGRAM_BOT_TOKEN,
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
