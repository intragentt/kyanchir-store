// Местоположение: src/app/layout.tsx
// Метафора: "Мозговой центр и Скелет Приложения"

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider'; // Наш "Агент Безопасности"
import AppCore from '@/components/AppCore'; // Наш "Мастер-отделочник"
import Script from 'next/script'; // Инструмент для вставки скриптов

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
        {/* ✅ Корректная работа на вырезах/жестах и в Telegram fullscreen */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        {/* Цвет системной строки в Android и в Телеге */}
        <meta name="theme-color" content="#FFFFFF" />
        {/* Стиль статус-бара в iOS standalone/PWA */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Рекомендуется для PWA/mini-app поведения */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Не автоссылать телефоны в iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>

      <body className="h-full">
        {/* ✅ Загружаем Telegram SDK максимально рано, до интерактива */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        {/* На всякий случай: если JS отключён, покажем сообщение */}
        <noscript>
          Для работы приложения требуется включить JavaScript.
        </noscript>

        <AuthProvider>
          {/* AppCore запрашивает fullscreen/expand и учитывает safe-area через CSS */}
          <AppCore>{children}</AppCore>
        </AuthProvider>
      </body>
    </html>
  );
}
