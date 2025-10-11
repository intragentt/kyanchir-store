// Местоположение: src/hooks/useScrollInfo.ts

import { useState, useEffect, useRef } from 'react';

// Определяем, что будет возвращать наш хук
export interface ScrollInfo {
  scrollY: number;
  scrollDirection: 'up' | 'down' | null;
}

// Хук, который следит за прокруткой страницы
export function useScrollInfo(): ScrollInfo {
  const lastScrollYRef = useRef(0);
  const lastDirectionRef = useRef<ScrollInfo['scrollDirection']>(null);
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
    scrollY: 0,
    scrollDirection: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;

      const direction: ScrollInfo['scrollDirection'] =
        currentScrollY === previousScrollY
          ? lastDirectionRef.current
          : currentScrollY > previousScrollY
            ? 'down'
            : 'up';

      lastScrollYRef.current = currentScrollY;
      lastDirectionRef.current = direction;

      setScrollInfo({
        scrollY: currentScrollY,
        scrollDirection: direction,
      });
    };

    // Safari на iOS может пропускать события при агрессивном скролле, если пересоздавать
    // обработчик слишком часто. Поэтому держим подписку стабильной и используем ref'ы.
    // Инициируем значения сразу после монтирования, чтобы отдать актуальные данные слушателям.
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollInfo;
}
