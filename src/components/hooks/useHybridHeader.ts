'use client';

import { useState, useEffect, useRef } from 'react';

// Хук, реализующий "гибридное" поведение шапки
export const useHybridHeader = (headerRef: React.RefObject<HTMLElement>) => {
  const [translateY, setTranslateY] = useState(0);

  // Используем useRef для хранения значений, которые не должны вызывать ре-рендер
  const lastScrollY = useRef(0);
  const lastDir = useRef(0); // 1 = down, -1 = up
  const currentTranslate = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    // --- Параметры поведения из вашего ТЗ ---
    const smallDelta = 8;
    const revealThreshold = 80;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      headerEl.style.transition = 'none';
    }

    const onScroll = () => {
      const headerHeight = headerEl.offsetHeight;
      const y = window.scrollY;
      const dy = y - lastScrollY.current;
      const dir = dy > 0 ? 1 : dy < 0 ? -1 : 0;

      if (Math.abs(dy) < smallDelta || dir === 0) {
        lastScrollY.current = y;
        return;
      }

      // Вычисляем целевое смещение, пиксель-в-пиксель
      let targetTranslate = currentTranslate.current - dy;

      // Ограничиваем значения между 0 (полностью виден) и -headerHeight (полностью скрыт)
      targetTranslate = Math.max(-headerHeight, Math.min(0, targetTranslate));

      // Логика "прилипания" при смене направления на "вверх"
      if (dir === -1 && lastDir.current === 1) {
        // Если мы только что начали скроллить вверх, требуем пройти порог
        const pulledUp = lastScrollY.current - y;
        if (pulledUp < revealThreshold) {
          targetTranslate = currentTranslate.current; // "Замораживаем" на месте
        }
      }

      currentTranslate.current = targetTranslate;
      lastDir.current = dir;
      lastScrollY.current = y;

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setTranslateY(currentTranslate.current);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [headerRef]);

  return { translateY };
};
