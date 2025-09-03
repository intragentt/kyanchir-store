// Местоположение: tailwind.config.ts
// Метафора: "Палитра художника и набор инструментов дизайнера".

import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  // "Карта сокровищ"
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // "Линейка для адаптивности"
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      'kyanchir-lg': '1025px',
      '2xl': '1536px',
    },
    extend: {
      // "Фирменная палитра"
      colors: {
        brand: { lilac: '#6B80C5', 'lilac-light': '#C1D0FF' },
        accent: {
          pink: '#C1D0FF',
          'pink-light': '#FBC0E3',
          'pink-pale': '#FFE1F3',
        },
        feedback: { error: '#E06F6F', red: '#D32F2F' },
        text: { primary: '#272727', secondary: '#6B80C5' },
        background: { primary: '#FFFFFF', secondary: '#FFE1F3' },
      },
      // "Набор фирменных шрифтов"
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      // "Типографика"
      fontSize: {
        'clamp-banner-main': ['clamp(1rem, 5vw, 3rem)', { lineHeight: '1.1' }],
        'clamp-banner-info': [
          'clamp(0.8rem, 3vw, 1.25rem)',
          { lineHeight: '1.2' },
        ],
      },
      typographyStyles: ({ theme }: { theme: any }) => ({
        h1: {
          fontSize: '3rem',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          '@screen md': { fontSize: '4.5rem' },
          '@screen lg': { fontSize: '6rem' },
        },
        h2: {
          fontSize: '2.25rem',
          lineHeight: '1.25',
          letterSpacing: '-0.01em',
          '@screen md': { fontSize: '3rem' },
          '@screen lg': { fontSize: '3.75rem' },
        },
        h3: {
          fontSize: '1.875rem',
          lineHeight: '1.3',
          letterSpacing: '0em',
          '@screen md': { fontSize: '2.25rem' },
          '@screen lg': { fontSize: '2.5rem' },
        },
        'body-base': {
          fontSize: '1rem',
          lineHeight: '1.6',
          '@screen md': { fontSize: '1.125rem' },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/forms'),
    plugin(function ({ addUtilities, theme }) {
      // --- НАЧАЛО ИЗМЕНЕНИЙ: Явно указываем тип для newUtilities ---
      const newUtilities: { [key: string]: any } = {};
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      const typographyStyles = theme('typographyStyles');

      for (const key in typographyStyles) {
        const {
          '@screen md': mdStyles,
          '@screen lg': lgStyles,
          ...baseStyles
        } = typographyStyles[key];

        const utilityClass = `.text-${key}`;
        newUtilities[utilityClass] = baseStyles;

        if (mdStyles) {
          newUtilities[`@media (min-width: ${theme('screens.md')})`] = {
            [utilityClass]: mdStyles,
          };
        }
        if (lgStyles) {
          newUtilities[`@media (min-width: ${theme('screens.lg')})`] = {
            [utilityClass]: lgStyles,
          };
        }
      }

      addUtilities(newUtilities);
    }),
  ],
};

export default config;
