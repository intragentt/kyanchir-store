// Местоположение: tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      'kyanchir-lg': '1025px', // Кастомный брейкпоинт для выравнивания
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          lilac: '#6B80C5',
          'lilac-light': '#C1D0FF',
        },
        accent: {
          pink: '#C1D0FF',
          'pink-light': '#FBC0E3',
          'pink-pale': '#FFE1F3',
        },
        feedback: {
          error: '#E06F6F',
          red: '#D32F2F',
        },
        text: {
          primary: '#272727',
          secondary: '#6B80C5',
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#FFE1F3',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        // H1: Главный заголовок страницы (clamp: от 32px до 96px)
        h1: [
          '3rem', // Мобильные: 48px (min-value в clamp)
          {
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            '@screen md': { fontSize: '4.5rem' }, // Планшеты: 72px
            '@screen lg': { fontSize: '6rem' }, // ПК: 96px (max-value в clamp)
          },
        ],
        // H2: Подзаголовки разделов (clamp: от 28px до 60px)
        h2: [
          '2.25rem', // Мобильные: 36px
          {
            lineHeight: '1.25',
            letterSpacing: '-0.01em',
            '@screen md': { fontSize: '3rem' }, // Планшеты: 48px
            '@screen lg': { fontSize: '3.75rem' }, // ПК: 60px
          },
        ],
        // H3: Меньшие заголовки (clamp: от 20.8px до 40px)
        h3: [
          '1.875rem', // Мобильные: 30px
          {
            lineHeight: '1.3',
            letterSpacing: '0em',
            '@screen md': { fontSize: '2.25rem' }, // Планшеты: 36px
            '@screen lg': { fontSize: '2.5rem' }, // ПК: 40px
          },
        ],

        // body-lg: Крупный текст (clamp: от 18px до 20px)
        'body-lg': [
          '1.125rem', // Мобильные: 18px
          {
            lineHeight: '1.6',
            '@screen md': { fontSize: '1.25rem' }, // Планшеты: 20px
          },
        ],
        // body-base: Стандартный текст (clamp: от 16px до 18px)
        'body-base': [
          '1rem', // Мобильные: 16px
          {
            lineHeight: '1.6',
            '@screen md': { fontSize: '1.125rem' }, // Планшеты: 18px
          },
        ],
        // body-sm: Мелкий текст (clamp: от 14px до 16px)
        'body-sm': [
          '0.875rem', // Мобильные: 14px
          {
            lineHeight: '1.5',
            '@screen md': { fontSize: '1rem' }, // Планшеты: 16px
          },
        ],
        // body-xs: Очень мелкий текст (12px для всех)
        'body-xs': [
          '0.75rem', // 12px для всех
          { lineHeight: '1.5' },
        ],

        // btn: Текст кнопки (clamp: от 16px до 18px)
        btn: [
          '1rem', // Мобильные: 16px
          {
            lineHeight: '1',
            fontWeight: '700',
            '@screen md': { fontSize: '1.125rem' }, // Планшеты: 18px
          },
        ],
        // nav: Текст навигации (clamp: от 18px до 20px)
        nav: [
          '1.125rem', // Мобильные: 18px
          {
            lineHeight: '1',
            fontWeight: '500',
            '@screen md': { fontSize: '1.25rem' }, // Планшеты: 20px
          },
        ],

        // --- КЛАССЫ ДЛЯ АДАПТИВНОГО ТЕКСТА БАННЕРОВ (используются в MiniBannerSlider) ---
        // clamp-banner-main: Основной заголовок на баннере (от 16px до 48px)
        'clamp-banner-main': ['clamp(1rem, 5vw, 3rem)', { lineHeight: '1.1' }],
        // clamp-banner-info: Подзаголовок / описание на баннере (от 12.8px до 20px)
        'clamp-banner-info': [
          'clamp(0.8rem, 3vw, 1.25rem)',
          { lineHeight: '1.2' },
        ],
        // clamp-banner-subinfo: Дополнительная информация на баннере (от 11.2px до 16px)
        'clamp-banner-subinfo': [
          'clamp(0.7rem, 2vw, 1rem)',
          { lineHeight: '1.3' },
        ],

        // --- КЛАССЫ ДЛЯ ОТЛАДОЧНОГО ТЕКСТА ВНУТРИ ЗОН И КНОПОК (в MiniBannerSlider) ---
        // clamp-safezone-text: Текст внутри безопасной зоны (от 9.6px до 16px)
        'clamp-safezone-text': [
          'clamp(0.6rem, 2.5vw, 1rem)',
          { lineHeight: '1.3' },
        ],
        // clamp-debug-small: Мелкий текст для кнопок на баннере (от 9.6px до 14.4px)
        'clamp-debug-small': [
          'clamp(0.6rem, 1.5vw, 0.9rem)',
          { lineHeight: '1.2' },
        ],
        // clamp-debug-tiny: Очень мелкий текст для отладочных меток (от 6.4px до 11.2px)
        'clamp-debug-tiny': [
          'clamp(0.4rem, 1vw, 0.7rem)',
          { lineHeight: '1.1' },
        ],
      },
    },
  },
  // <--- ВАЖНО: Добавляем плагин @tailwindcss/line-clamp
  plugins: [require('@tailwindcss/line-clamp'), require('@tailwindcss/forms')],
};

export default config;
