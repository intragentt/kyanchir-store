// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Убираем `export`, делая эту константу локальной ---
const authOptions: NextAuthOptions = {
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'telegram-credentials',
      name: 'Telegram Login',
      credentials: {
        token: { label: 'Login Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          return null;
        }

        const loginToken = await prisma.loginToken.findUnique({
          where: { token: credentials.token },
        });

        if (
          !loginToken ||
          !loginToken.userId ||
          loginToken.expires < new Date()
        ) {
          return null;
        }

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
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify-request',
    error: '/login/error',
  },
  session: {
    // В next-auth v4, при использовании адаптера, стратегия по умолчанию 'database',
    // 'jwt' нужен только если вы хотите кастомизировать токен. Для нашей схемы лучше 'database'.
    strategy: 'database',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
