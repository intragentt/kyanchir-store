// Местоположение: src/app/fonts.ts

// 1. Импортируем актуальные шрифты из библиотеки Google Fonts.
import { Manrope, PT_Mono } from 'next/font/google';

// 2. Заголовки используют Manrope с переменной --font-heading.
export const fontHeading = Manrope({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800'],
});

// 3. Основной текст также использует Manrope, но со своей переменной.
export const fontBody = Manrope({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});

// 4. Акцентный / моноширинный шрифт — PT Mono.
export const fontMono = PT_Mono({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-mono', // Переменная для ацентного/моношириного
  // У PT Mono только одно стандартное начертание, поэтому указываем '400' (Regular).
  weight: '400',
});