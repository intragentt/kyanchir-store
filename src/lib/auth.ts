// Местоположение: src/lib/auth.ts

import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import type { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
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
          include: { role: true },
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
          include: { role: true },
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
        if (!credentials?.email || !credentials?.token) return null;
        const verificationToken = await prisma.verificationToken.findUnique({
          where: {
            identifier_token: {
              identifier: credentials.email,
              token: credentials.token,
            },
          },
        });
        if (!verificationToken || verificationToken.expires < new Date())
          return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
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
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Возвращаем универсальное имя переменной ---
  secret: process.env.AUTH_SECRET,
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        if (user.role) {
          // @ts-ignore
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        if (token.role) {
          // @ts-ignore
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);
