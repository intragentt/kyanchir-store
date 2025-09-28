import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { createHash } from '@/lib/encryption';

const cookieDomain =
  process.env.NODE_ENV === 'production' ? '.kyanchir.ru' : undefined;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      // --- НАЧАЛО ИЗМЕНЕНИЙ: "Декларируем" все возможные поля ---
      // Мы говорим TypeScript, что credentials МОЖЕТ содержать эти поля.
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        id: { label: 'User ID', type: 'text' },
        // Добавляем остальные поля, которые могут прийти от нашего API
        name_encrypted: { label: 'Name', type: 'text' },
        surname_encrypted: { label: 'Surname', type: 'text' },
      },
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      async authorize(credentials) {
        if (!credentials) return null;

        // --- РЕЖИМ 2: Вход по коду (проброс данных) ---
        // Теперь эта проверка корректна с точки зрения TypeScript
        if (!credentials.password && credentials.id) {
          const user = await prisma.user.findUnique({
            where: { id: credentials.id }, // credentials.id теперь существует
            include: { role: true },
          });
          return user;
        }

        // --- РЕЖИМ 1: Стандартный вход по email и паролю ---
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const emailHash = createHash(credentials.email.toLowerCase());
        const user = await prisma.user.findUnique({
          where: { email_hash: emailHash },
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
          include: { user: { include: { role: true } } },
        });
        if (!loginToken || !loginToken.user || loginToken.expires < new Date())
          return null;
        return loginToken.user;
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
        token.role = (user as any).role;
        token.bonusPoints = (user as any).bonusPoints;
        token.emailVerified = (user as any).emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.bonusPoints = token.bonusPoints;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

export const auth = () => getServerSession(authOptions);
