'use client';

import { useState, useEffect, useRef } from 'react';

// Хук теперь принимает состояние оверлея, чтобы "излечиваться" от амнезии
export const useHybridHeader = (
  headerRef: React.RefObject<HTMLElement>,
  isOverlayOpen: boolean,
) => {
  const [translateY, setTranslateY] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const lastScrollY = useRef(0);
  const currentTranslate = useRef(0);
  const ticking = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTouching = useRef(false);

  // Этот useEffect следит за состоянием оверлея (меню/поиск)
  useEffect(() => {
    // Если оверлей был только что закрыт
    if (!isOverlayOpen) {
      // Принудительно возвращаем шапку в полностью видимое состояние
      currentTranslate.current = 0;
      setTranslateY(0);
      setOpacity(1);
      // И сбрасываем позицию скролла, чтобы хук не думал, что мы скроллим вниз
      lastScrollY.current = window.scrollY;
    }
  }, [isOverlayOpen]); // Зависит только от состояния оверлея

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

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
      // Если оверлей открыт, мы полностью игнорируем все события скролла
      if (isOverlayOpen) return;

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

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
    };
  }, [headerRef, isOverlayOpen]); // Добавляем isOverlayOpen в зависимости, чтобы переподписываться на события

  return { translateY, opacity };
};
