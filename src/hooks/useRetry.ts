'use client';

import { useCallback } from 'react';

interface UseRetryOptions {
  /**
   * 🔁 Количество повторов
   */
  retries?: number;
  /**
   * ⏱️ Задержка между попытками в миллисекундах
   */
  delay?: number;
  /**
   * 📝 Колбэк при каждой попытке
   */
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * 🔄 ХУК ДЛЯ ПОВТОРНЫХ ПОПЫТОК ASYNC-ЗАПРОСОВ
 */
function useRetry(options: UseRetryOptions = {}) {
  const { retries = 2, delay = 500, onRetry } = options;

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      let attempt = 0;
      let lastError: unknown = null;

      while (attempt <= retries) {
        try {
          console.log('🔄 useRetry: попытка', { attempt });
          const result = await fn();
          console.log('✅ useRetry: успех', { attempt });
          return result;
        } catch (error) {
          lastError = error;
          console.log('❌ useRetry: ошибка', { attempt, error });
          if ((error as { skipRetry?: boolean })?.skipRetry) {
            console.log('⚠️ useRetry: повтор отключён по флагу skipRetry');
            break;
          }
          if (attempt === retries) {
            break;
          }

          onRetry?.(attempt + 1, error);
          attempt += 1;

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError ?? new Error('useRetry: неизвестная ошибка');
    },
    [delay, onRetry, retries],
  );

  return { execute };
}

export { useRetry };
export type { UseRetryOptions };
