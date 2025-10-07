'use client';

import { useEffect, useRef, useState } from 'react';

interface UseDebounceOptions {
  /**
   * ⏱️ Максимальное время ожидания до принудительного обновления
   */
  maxWait?: number;
}

/**
 * 🕒 ДЕБОУНС ДЛЯ ИНПУТОВ И ФИЛЬТРОВ
 */
function useDebounce<T>(value: T, delay = 300, options: UseDebounceOptions = {}) {
  const { maxWait } = options;
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🔄 useDebounce: планируем обновление', { value, delay, maxWait });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      console.log('✅ useDebounce: обновляем значение', { value });
      setDebouncedValue(value);
    }, delay);

    if (maxWait && !maxWaitRef.current) {
      maxWaitRef.current = setTimeout(() => {
        console.log('⚠️ useDebounce: maxWait достигнут', { value });
        setDebouncedValue(value);
        maxWaitRef.current && clearTimeout(maxWaitRef.current);
        maxWaitRef.current = null;
      }, maxWait);
    }

    return () => {
      timeoutRef.current && clearTimeout(timeoutRef.current);
      if (maxWaitRef.current) {
        clearTimeout(maxWaitRef.current);
        maxWaitRef.current = null;
      }
    };
  }, [value, delay, maxWait]);

  return debouncedValue;
}

export { useDebounce };
export type { UseDebounceOptions };
