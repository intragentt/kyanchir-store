// Местоположение: src/app/layout.tsx
// Метафора: "Мозговой центр и Скелет Приложения" (Теперь это чистый Серверный Компонент)

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import AuthProvider from '@/components/providers/AuthProvider'; // Наш "Агент Безопасности"
import AppCore from '@/components/AppCore'; // Наш новый "Мастер-отделочник"

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
      <body className="flex h-full min-h-screen flex-col">
        {/* 
          СТРУКТУРА:
          1. "Агент Безопасности" (AuthProvider) оборачивает всё.
          2. "Мастер-отделочник" (AppCore) отвечает за всю внутреннюю структуру и интерактивность.
          3. "Дети" (children) — это конкретная страница, которую мы показываем.
        */}
        <AuthProvider>
          <AppCore>{children}</AppCore>
        </AuthProvider>
      </body>
    </html>
  );
}
