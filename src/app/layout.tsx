// Метафора: "Скелет Приложения" (без UI)

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider';
// AppCore был удален отсюда
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
        <Script id="scroll-restoration-fix" strategy="beforeInteractive">
          {`history.scrollRestoration = "manual"`}
        </Script>

        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <noscript>
          Для работы приложения требуется включить JavaScript.
        </noscript>

        <AuthProvider>
          {/* ИЗМЕНЕНИЕ: AppCore здесь больше нет. Мы просто рендерим дочерние элементы.
              Теперь /admin/layout.tsx и /(site)/layout.tsx могут работать независимо. */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
