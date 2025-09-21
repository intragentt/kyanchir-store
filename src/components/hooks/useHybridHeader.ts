'use client';

import { useState, useEffect, useRef } from 'react';

// Хук, реализующий "гибридное" поведение шапки с "примагничиванием"
export const useHybridHeader = (headerRef: React.RefObject<HTMLElement>) => {
  const [translateY, setTranslateY] = useState(0);

  const lastScrollY = useRef(0);
  const currentTranslate = useRef(0);
  const ticking = useRef(false);
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем ref для таймера ---
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
          setTranslateY(currentTranslate.current);
          ticking.current = false;

          // --- НАЧАЛО ИЗМЕНЕНИЙ: Логика определения конца скролла ---
          // Сбрасываем предыдущий таймер
          if (scrollEndTimeout.current) {
            clearTimeout(scrollEndTimeout.current);
          }

          // Устанавливаем новый таймер. Если он сработает, значит скролл закончился.
          scrollEndTimeout.current = setTimeout(() => {
            const currentPos = currentTranslate.current;
            const snapThreshold = headerHeight * 0.53;

            // Если шапка не в крайних положениях
            if (currentPos > -headerHeight && currentPos < 0) {
              // Если скрыта больше, чем на 53%, скрываем полностью
              if (currentPos < -snapThreshold) {
                currentTranslate.current = -headerHeight;
              } else {
                // Иначе, показываем полностью
                currentTranslate.current = 0;
              }
              // Обновляем состояние для плавной анимации "примагничивания"
              setTranslateY(currentTranslate.current);
            }
          }, 150); // 150ms - хорошая задержка для определения остановки
          // --- КОНЕЦ ИЗМЕНЕНИЙ ---
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Очистка таймера при размонтировании компонента
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
    };
  }, [headerRef]);

  return { translateY };
};
