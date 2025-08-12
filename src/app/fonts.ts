// Местоположение: src/app/fonts.ts

// 1. Импортируем все три нужных нам шрифты из библиотеки Google Fonts.
import { Unbounded, Manrope, PT_Mono } from 'next/font/google';

// 2. Настраиваем шрифт для ЗАГОЛОВКОВ (Unbounded).
export const fontHeading = Unbounded({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-heading', // Переменная для заголовков
  weight: 'variable',
});

// 3. Настраиваем шрифт для ОСНОВНОГО ТЕКСТА (Manrope).
export const fontBody = Manrope({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-body', // Переменная для основного текста
  weight: ['200', '300', '400', '500', '600', '700', '800'], 
});

// 4. НОВЫЙ ШРИФТ! Настраиваем шрифт для АКЦЕНТНОГО/МОНОШИРИННОГО ТЕКСТА (PT Mono).
export const fontMono = PT_Mono({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-mono', // Переменная для ацентного/моношириного
  // У PT Mono только одно стандартное начертание, поэтому указываем '400' (Regular).
  weight: '400', 
});