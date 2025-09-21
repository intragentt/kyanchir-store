'use client';

import { useState, useEffect, useRef } from 'react';

// Хук, реализующий "гибридное" поведение шапки с вычислением прозрачности
export const useHybridHeader = (headerRef: React.RefObject<HTMLElement>) => {
  const [translateY, setTranslateY] = useState(0);
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем состояние для прозрачности ---
  const [opacity, setOpacity] = useState(1);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const lastScrollY = useRef(0);
  const currentTranslate = useRef(0);
  const ticking = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const smallDelta = 8;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      headerEl.style.transition = 'none';
    }

    const onScroll = () => {
      const headerHeight = headerEl.offsetHeight;
      if (headerHeight === 0) return;

      const y = window.scrollY;
      const dy = y - lastScrollY.current;

      if (Math.abs(dy) < smallDelta) {
        lastScrollY.current = y;
        return;
      }

      let targetTranslate = currentTranslate.current - dy;
      targetTranslate = Math.max(-headerHeight, Math.min(0, targetTranslate));

      currentTranslate.current = targetTranslate;
      lastScrollY.current = y;

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          // --- НАЧАЛО ИЗМЕНЕНИЙ: Вычисляем и устанавливаем прозрачность ---
          const hiddenRatio = Math.abs(currentTranslate.current) / headerHeight;
          const newOpacity = Math.max(0, 1 - hiddenRatio * 1.5); // *1.5 для более быстрого исчезновения

          setTranslateY(currentTranslate.current);
          setOpacity(newOpacity);
          // --- КОНЕЦ ИЗМЕНЕНИЙ ---

          ticking.current = false;

          if (scrollEndTimeout.current) {
            clearTimeout(scrollEndTimeout.current);
          }

          scrollEndTimeout.current = setTimeout(() => {
            const currentPos = currentTranslate.current;
            const snapThreshold = headerHeight * 0.53;

            if (currentPos > -headerHeight && currentPos < 0) {
              if (currentPos < -snapThreshold) {
                currentTranslate.current = -headerHeight;
              } else {
                currentTranslate.current = 0;
              }
              // Обновляем состояние для анимации "примагничивания"
              setTranslateY(currentTranslate.current);
              // Также обновляем прозрачность до финального значения
              setOpacity(currentTranslate.current === 0 ? 1 : 0);
            }
          }, 150);
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
    };
  }, [headerRef]);

  // --- ИЗМЕНЕНИЕ: Возвращаем оба значения ---
  return { translateY, opacity };
};
