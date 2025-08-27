// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { createTransport } from 'nodemailer';

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) {
          return null;
        }
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (isValid) {
          return user;
        }
        return null;
      },
    }),
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
        const verificationToken = await prisma.verificationToken.findUnique({
          where: {
            identifier_token: {
              identifier: credentials.email,
              token: credentials.token,
            },
          },
        });
        if (!verificationToken || verificationToken.expires < new Date()) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
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
      // Этот коллбэк правильно добавляет id в JWT токен. Он остается без изменений.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Переписываем session callback, чтобы он был более явным и надежным.
    async session({ session, token }) {
      // `token` здесь - это расшифрованный JWT, который мы собрали в коллбэке `jwt`.
      // Мы берем `id` из токена и **гарантированно** помещаем его в объект `session.user`.
      // Эта версия более надежна, чем простое присваивание.
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
