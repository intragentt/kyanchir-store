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
      credentials: {
        token: { label: 'Login Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

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

      generateVerificationToken: async () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      },

      sendVerificationRequest: async ({
        identifier: email,
        url,
        token,
        provider,
      }) => {
        const { host } = new URL(url);
        const transport = createTransport(provider.server);

        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: `Ваш код для входа в Kyanchir`,
          html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
              <h2 style="color: #333;">Ваш код для входа</h2>
              <p style="color: #555; font-size: 16px;">Используйте этот код для завершения авторизации на сайте ${host}.</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; padding: 15px; background-color: #f2f2f2; border-radius: 8px;">
                ${token}
              </div>
              <p style="color: #888; font-size: 14px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 14px;">Или войдите по ссылке:</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #6B80C5; color: white; text-decoration: none; border-radius: 5px;">
                Войти в Kyanchir
              </a>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login/error',
  },
  session: {
    // Эта сессия теперь используется только для EmailProvider, наша основная - JWT в cookie
    strategy: 'database',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
