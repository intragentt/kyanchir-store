'use client';

import { useState, useEffect, useRef } from 'react';

// Хук с полностью переработанной, надежной логикой
export const useHybridHeader = (
  headerRef: React.RefObject<HTMLElement>,
  isOverlayOpen: boolean,
) => {
  const [translateY, setTranslateY] = useState(0);
  const [opacity, setOpacity] = useState(1);

  // Используем useRef для всех "внутренних" состояний, которые не вызывают ре-рендер
  const lastScrollY = useRef(0);
  const currentTranslate = useRef(0);
  const ticking = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTouching = useRef(false);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Единый, главный useEffect, который управляет всем ---
  useEffect(() => {
    // Если оверлей (меню/поиск) открыт, мы не делаем НИЧЕГО.
    // Хук "спит", слушателей скролла нет.
    if (isOverlayOpen) {
      return;
    }

    // Как только оверлей закрывается, этот код "просыпается"
    const headerEl = headerRef.current;
    if (!headerEl) return;

    // ШАГ 1: Принудительно сбрасываем состояние шапки в "видимое"
    currentTranslate.current = 0;
    setTranslateY(0);
    setOpacity(1);
    // ШАГ 2: Сбрасываем "память" о скролле, чтобы избежать "амнезии"
    lastScrollY.current = window.scrollY;

    const smallDelta = 8;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      headerEl.style.transition = 'none';
    }

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

    const onScroll = () => {
      const y = window.scrollY;
      const headerHeight = headerEl.offsetHeight;
      if (headerHeight === 0) return;

      if (y <= 0) {
        currentTranslate.current = 0;
        lastScrollY.current = y;
        if (!ticking.current) {
          window.requestAnimationFrame(() => {
            setTranslateY(0);
            setOpacity(1);
            ticking.current = false;
          });
          ticking.current = true;
        }
        return;
      }

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

          if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
          scrollEndTimeout.current = setTimeout(() => {
            if (!isTouching.current) {
              snapToEdge();
            }
          }, 150);
        });
        ticking.current = true;
      }
    };

    const onTouchStart = () => {
      isTouching.current = true;
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
    };

    const onTouchEnd = () => {
      isTouching.current = false;
      snapToEdge();
    };

    // ШАГ 3: Только теперь, с чистым состоянием, подписываемся на события
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // Функция очистки удалит слушатели, когда оверлей снова откроется
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
    };
  }, [headerRef, isOverlayOpen]); // Этот хук теперь зависит только от этих двух вещей

  return { translateY, opacity };
};
