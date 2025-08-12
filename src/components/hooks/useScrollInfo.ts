// Местоположение: src/hooks/useScrollInfo.ts

import { useState, useEffect } from 'react';

// Определяем, что будет возвращать наш хук
export interface ScrollInfo {
  scrollY: number;
  scrollDirection: 'up' | 'down' | null;
}

// Хук, который следит за прокруткой страницы
export function useScrollInfo(): ScrollInfo {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
    scrollY: 0,
    scrollDirection: null,
  });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';

      setScrollInfo({
        scrollY: currentScrollY,
        scrollDirection: direction,
      });

      setLastScrollY(currentScrollY);
    };

    // Вызываем handleScroll один раз при монтировании, чтобы инициализировать значения
    if (typeof window !== 'undefined') {
      handleScroll();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]); // Зависимость от lastScrollY гарантирует, что мы всегда сравниваем с актуальным предыдущим значением

  return scrollInfo;
}
