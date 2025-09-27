import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем нашу крипто-утилиту ---
import { createHash } from '@/lib/encryption';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
        
        // --- НАЧАЛО ИЗМЕНЕНИЙ: Ищем пользователя по хэшу email ---
        const emailHash = createHash(credentials.email);
        const user = await prisma.user.findUnique({
          where: { email_hash: emailHash },
          include: { role: true },
        });
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
        
        // --- НАЧАЛО ИЗМЕНЕНИЙ: Ищем пользователя по хэшу email ---
        const emailHash = createHash(credentials.email);
        const user = await prisma.user.findUnique({
          where: { email_hash: emailHash },
          include: { role: true },
        });
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
        
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.bonusPoints = user.bonusPoints;
        token.emailVerified = user.emailVerified;
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