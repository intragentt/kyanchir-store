// Местоположение: src/app/layout.tsx
// Метафора: "Мозговой центр и Скелет Приложения"

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import AppCore from '@/components/AppCore'; // Убираем дефис
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import Script from 'next/script';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { JWTPayload } from 'jose';

export interface UserPayload extends JWTPayload {
  userId?: string;
  name?: string | null;
  email?: string | null;
}

export const metadata = {
  title: 'Kyanchir',
  description: 'Мини-приложение / сайт',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionCookie = (await cookies()).get('session')?.value;
  const user = (await decrypt(sessionCookie)) as UserPayload | null;

  return (
    <html
      lang="ru"
      className={`h-full ${fontHeading.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>

      <body className="h-full">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <noscript>
          Для работы приложения требуется включить JavaScript.
        </noscript>

        <AuthProvider>
          <AppCore initialUser={user}>{children}</AppCore>
        </AuthProvider>
      </body>
    </html>
  );
}
