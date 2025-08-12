// Местоположение: src/hooks/useElementRect.ts

import { useState, useLayoutEffect, RefObject } from 'react';

// Интерфейс не меняется
export interface ElementRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function useElementRect(
  ref: RefObject<HTMLElement | null>,
): ElementRect | null {
  const [rect, setRect] = useState<ElementRect | null>(null);

  useLayoutEffect(() => {
    // Эта функция будет вызываться при любом событии
    const updateRect = () => {
      if (ref.current) {
        // Мы используем getBoundingClientRect, потому что он дает позицию
        // относительно видимой области окна, что идеально для нашей задачи.
        setRect(ref.current.getBoundingClientRect());
      }
    };

    // Вызываем сразу, чтобы получить начальные размеры
    updateRect();

    // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ: ДОБАВЛЯЕМ СЛУШАТЕЛЯ НА SCROLL ---
    // Теперь наш хук будет пересчитывать позицию при каждом скролле.
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);

    // Очищаем подписки, чтобы избежать утечек памяти
    return () => {
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
    // Эффект перезапустится, только если изменится сам объект ref
  }, [ref]);

  return rect;
}
