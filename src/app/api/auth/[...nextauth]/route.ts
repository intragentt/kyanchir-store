// Местоположение: src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// 1. Импортируем bcrypt для сравнения паролей.
import bcrypt from 'bcrypt';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { createTransport } from 'nodemailer';

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Провайдер №1: Классический вход по Email и Паролю.
    // Это наш основной "Швейцар".
    CredentialsProvider({
      // 2. Мы можем не указывать id, тогда по умолчанию он будет 'credentials'.
      // Это именно то, что мы вызываем со страницы регистрации.
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 3. Проверяем, что email и пароль были предоставлены.
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 4. Ищем пользователя в базе данных по email.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 5. Если пользователь не найден или у него не сохранен хэш пароля - отказываем.
        if (!user || !user.passwordHash) {
          return null;
        }

        // 6. Сравниваем предоставленный пароль с хэшем в базе.
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        // 7. Если пароли совпадают, возвращаем пользователя. Next-Auth создаст сессию.
        if (isValid) {
          return user;
        }

        // Если пароли не совпали - отказываем.
        return null;
      },
    }),
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    // Провайдер №2: Вход по токену из Telegram
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

    // Провайдер №3: Вход по одноразовому коду из Email
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

    // Этот провайдер-пустышка больше не нужен, так как мы полностью управляем процессом
    // EmailProvider({ ... }),
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
