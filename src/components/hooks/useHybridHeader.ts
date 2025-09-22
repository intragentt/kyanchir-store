'use client';

import { useState, useEffect, useRef } from 'react';

// Хук, реализующий "гибридное" поведение шапки с "примагничиванием" и touch-логикой
export const useHybridHeader = (headerRef: React.RefObject<HTMLElement>) => {
  const [translateY, setTranslateY] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const lastScrollY = useRef(0);
  const currentTranslate = useRef(0);
  const ticking = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем флаг для отслеживания касания ---
  const isTouching = useRef(false);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const smallDelta = 8;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      headerEl.style.transition = 'none';
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Выносим логику "примагничивания" в отдельную функцию ---
    const snapToEdge = () => {
      const headerHeight = headerEl.offsetHeight;
      if (headerHeight === 0) return;

      const currentPos = currentTranslate.current;
      const snapThreshold = headerHeight * 0.53;

      if (currentPos > -headerHeight && currentPos < 0) {
        if (currentPos < -snapThreshold) {
          currentTranslate.current = -headerHeight;
        } else {
          currentTranslate.current = 0;
        }
        setTranslateY(currentTranslate.current);
        setOpacity(currentTranslate.current === 0 ? 1 : 0);
      }
    };
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    const onScroll = () => {
      // Логика pixel-by-pixel отслеживания остается той же
      const headerHeight = headerEl.offsetHeight;
      if (headerHeight === 0) return;
      const y = window.scrollY;
      const dy = y - lastScrollY.current;
      if (Math.abs(dy) < smallDelta) return;

      let targetTranslate = currentTranslate.current - dy;
      targetTranslate = Math.max(-headerHeight, Math.min(0, targetTranslate));

      currentTranslate.current = targetTranslate;
      lastScrollY.current = y;

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const hiddenRatio = Math.abs(currentTranslate.current) / headerHeight;
          const newOpacity = Math.max(0, 1 - hiddenRatio * 1.5);

          setTranslateY(currentTranslate.current);
          setOpacity(newOpacity);
          ticking.current = false;

          // Логика для десктопа (срабатывает, когда нет касания)
          if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
          scrollEndTimeout.current = setTimeout(() => {
            // --- ИЗМЕНЕНИЕ: Проверяем, что палец не на экране ---
            if (!isTouching.current) {
              snapToEdge();
            }
          }, 150);
        });
        ticking.current = true;
      }
    };

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем обработчики касаний ---
    const onTouchStart = () => {
      isTouching.current = true;
      // Убиваем таймер, чтобы он не сработал во время касания
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
    };

    const onTouchEnd = () => {
      isTouching.current = false;
      // "Примагничиваем" сразу после отпускания пальца
      snapToEdge();
    };
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
    };
  }, [headerRef]);

  return { translateY, opacity };
};
