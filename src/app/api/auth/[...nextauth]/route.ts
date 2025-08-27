// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createTransport } from 'nodemailer';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Убираем 'export'. Этот объект - внутренняя деталь файла, а не то, что мы выставляем наружу.
const authOptions: NextAuthOptions = {
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
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

    CredentialsProvider({
      id: 'email-code',
      name: 'Email Code Verification',
      credentials: {
        email: { label: 'Email', type: 'text' },
        token: { label: 'Verification Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.token) {
          return null;
        }

        const verificationToken = await prisma.verificationToken.findFirst({
          where: { identifier: credentials.email },
        });

        if (
          !verificationToken ||
          verificationToken.token !== credentials.token ||
          verificationToken.expires < new Date()
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // После успешной верификации, токен можно удалить, чтобы он не был использован повторно
        if (user) {
          await prisma.verificationToken.delete({
            where: {
              identifier_token: {
                identifier: credentials.email,
                token: credentials.token,
              },
            },
          });
        }

        return user;
      },
    }),

    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      generateVerificationToken: async () => {
        return '';
      },
      sendVerificationRequest: async ({
        identifier: email,
        url,
        token,
        provider,
      }) => {
        return;
      },
    }),
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
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
