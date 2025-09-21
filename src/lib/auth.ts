import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';

const cookieDomain =
  process.env.NODE_ENV === 'production' ? '.kyanchir.ru' : undefined;

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
          where: { email: credentials.email.toLowerCase() },
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
              identifier: credentials.email.toLowerCase(),
              token: credentials.token,
            },
          },
        });
        if (!verificationToken || verificationToken.expires < new Date())
          return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { role: true },
        });
        if (user) {
          await prisma.verificationToken.delete({
            where: {
              identifier_token: {
                identifier: credentials.email.toLowerCase(),
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
    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    async jwt({ token, user }) {
      // При первом входе (когда `user` объект доступен), добавляем все нужные поля в токен
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.bonusPoints = user.bonusPoints;
        token.emailVerified = user.emailVerified; // <-- ДОБАВЛЕНО
      }
      return token;
    },
    async session({ session, token }) {
      // На каждой сессии, передаем данные из токена в объект `session.user`
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.bonusPoints = token.bonusPoints;
        session.user.emailVerified = token.emailVerified; // <-- ДОБАВЛЕНО
      }
      return session;
    },
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
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
