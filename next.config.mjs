// Местоположение: next.config.mjs
// Метафора: "Генеральный план застройки" или "Устав города".
// Этот файл устанавливает глобальные правила для всего проекта,
// которые Next.js использует при сборке и запуске.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- ПРАВИЛА "СТРОЙКИ" (ОПТИМИЗАЦИНЯ СБОРКИ) ---
  eslint: {
    ignoreDuringBuilds: true,
  },

  // --- ПРАВИЛА "БЕЗОПАСНОСТИ" (HTTP-ЗАГОЛОВКИ) ---
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },

  // --- ПРАВИЛА "УЛИЧНЫХ УКАЗАТЕЛЕЙ" (ПЕРЕНАПРАВЛЕНИЯ) ---
  async redirects() {
    return [
      // --- НАЧАЛО ИЗМЕНЕНИЙ: Редирект для админ-панели УДАЛЕН. ---
      // Эта логика будет перенесена в middleware для более умной обработки.
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      {
        source: '/help',
        destination: '/support',
        permanent: true,
      },
      {
        source: '/pomagite',
        destination: '/support',
        permanent: true,
      },
      {
        source: '/помощь',
        destination: '/support',
        permanent: true,
      },
      {
        source: '/поддержка',
        destination: '/support',
        permanent: true,
      },
      {
        source: '/обратнаясвязь',
        destination: '/support',
        permanent: true,
      },
    ];
  },

  // Здесь зарезервировано место для будущих глобальных настроек.
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'cdn.example.com',
  //     },
  //   ],
  // },
};

export default nextConfig;
