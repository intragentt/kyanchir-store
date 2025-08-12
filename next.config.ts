// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Отключаем проверку ESLint во время сборки (ускоряет деплой, ошибки всё равно можно проверять локально)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Настройка заголовков HTTP-ответов для всех маршрутов
  headers: async () => [
    {
      // Применяем эти заголовки ко всем путям (маршрутам) в приложении
      source: '/(.*)', // Это регулярное выражение означает "любой путь"
      headers: [
        {
          key: 'X-Frame-Options',
          // Было: 'ALLOWALL' — нестандартно и небезопасно.
          // Изменено на 'SAMEORIGIN' — позволяет встраивать сайт во фреймы только на том же домене.
          // Это защищает от clickjacking, но при этом даёт гибкость.
          value: 'SAMEORIGIN',
        },
        // Пример добавления другого заголовка:
        // {
        //   key: 'Strict-Transport-Security',
        //   value: 'max-age=31536000; includeSubDomains; preload',
        // },
      ],
    },
  ],

  // Дополнительные настройки Next.js могут быть добавлены здесь.
  // Например, настройка изображений, переменных окружения, перенаправлений и т.д.
  //
  // images: {
  //   domains: ['example.com'], // Если загружаешь изображения с внешних доменов
  // },
  //
  // experimental: {
  //   serverActions: true, // Включаем Server Actions (если используются)
  // },
};

export default nextConfig;
