// Местоположение: src/app/layout.tsx
// Метафора: "Мозговой центр и Скелет Приложения"

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider'; // Наш "Агент Безопасности"
import AppCore from '@/components/AppCore'; // Наш новый "Мастер-отделочник"
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем "инструмент" для вставки скриптов ---
import Script from 'next/script';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
      </head>
      <body>
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Вживляем "нейронный имплант" Telegram --- */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
        <AuthProvider>
          <AppCore>{children}</AppCore>
        </AuthProvider>
      </body>
    </html>
  );
}
