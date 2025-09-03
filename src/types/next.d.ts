// Местоположение: src/types/next.d.ts

// Этим файлом мы "перебиваем" стандартные типы Next.js, чтобы решить конфликт

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NextPage as NextNextPage } from 'next';

declare module 'next' {
  // Делаем searchParams необязательным, чтобы страницы без них не ломались
  export type PageProps = {
    params?: { [key: string]: string | undefined };
    searchParams?: { [key: string]: string | string[] | undefined };
  };
}
