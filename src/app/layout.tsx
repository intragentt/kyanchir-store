// Местоположение: src/app/layout.tsx
// Метафора: "Мозговой центр и Скелет Приложения"

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider';
import AppCore from '@/components/AppCore';
import Script from 'next/script';

export const metadata = {
  title: 'Kyanchir',
  description: 'Мини-приложение / сайт',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: "Атомный" скрипт для Safari --- */}
        {/* Этот скрипт выполняется ДО интерактивности React и принудительно отключает 
            "умное" восстановление скролла в браузере. Это решает баг с жестом обновления. */}
        <Script id="scroll-restoration-fix" strategy="beforeInteractive">
          {`history.scrollRestoration = "manual"`}
        </Script>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <noscript>
          Для работы приложения требуется включить JavaScript.
        </noscript>

        <AuthProvider>
          <AppCore>{children}</AppCore>
        </AuthProvider>
      </body>
    </html>
  );
}
