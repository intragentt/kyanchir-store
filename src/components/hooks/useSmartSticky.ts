import { useState, useEffect, RefObject, useRef } from 'react';
import { useElementRect } from './useElementRect';
import { useScrollInfo } from './useScrollInfo';

const SCROLL_UP_THRESHOLD = 250;
const SCROLL_DOWN_THRESHOLD = 50;

export interface SmartStickyOptions {
  headerHeight: number;
}

export interface SmartStickyResult {
  shouldRender: boolean;
  isTransitionEnabled: boolean;
  placeholderHeight: number;
  stickyStyles: React.CSSProperties;
}

export function useSmartSticky(
  targetRef: RefObject<HTMLElement | null>,
  workZoneRef: RefObject<HTMLElement | null>,
  options: SmartStickyOptions,
): SmartStickyResult {
  const { headerHeight } = options;

  const targetRect = useElementRect(targetRef);
  const workZoneRect = useElementRect(workZoneRef);
  const { scrollY, scrollDirection } = useScrollInfo();

  const [isVisible, setIsVisible] = useState(false);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

  const scrollUpAnchor = useRef<number | null>(null);
  const scrollDownAnchor = useRef<number | null>(null);

  useEffect(() => {
    if (!targetRect || !workZoneRect) return;

    // --- НОВОЕ, ЕДИНСТВЕННО ВЕРНОЕ ПРАВИЛО "СТЫКОВКИ" ---
    // Если верхняя граница ОРИГИНАЛА (`targetRect.top`) появилась на экране
    // и достигла места, где сидит КЛОН (`headerHeight`), значит,
    // клон свою задачу выполнил. Он должен исчезнуть МГНОВЕННО.
    if (targetRect.top >= headerHeight) {
      if (isVisible) {
        setIsVisible(false);
        setIsTransitionEnabled(false); // Отключаем анимацию для бесшовности
      }
      scrollUpAnchor.current = null;
      scrollDownAnchor.current = null;
      return; // Выходим. Остальная логика не нужна, т.к. оригинал на месте.
    }

    // Если мы прошли точку стыковки (скроллим вниз), снова включаем анимации
    if (!isTransitionEnabled) {
      setIsTransitionEnabled(true);
    }

    // Стандартная логика проверки, находимся ли мы в рабочей зоне
    const workZoneBottom = workZoneRect.top + scrollY + workZoneRect.height;
    const isInsideWorkZone = scrollY < workZoneBottom - headerHeight;
    if (!isInsideWorkZone) {
      if (isVisible) setIsVisible(false);
      return;
    }

    // Стандартная логика появления/исчезновения по направлению скролла
    if (scrollDirection === 'up') {
      scrollDownAnchor.current = null;
      if (scrollUpAnchor.current === null) {
        scrollUpAnchor.current = scrollY;
      }
      if (
        scrollUpAnchor.current !== null &&
        scrollUpAnchor.current - scrollY > SCROLL_UP_THRESHOLD
      ) {
        if (!isVisible) setIsVisible(true);
      }
    } else if (scrollDirection === 'down') {
      scrollUpAnchor.current = null;
      if (scrollDownAnchor.current === null) {
        scrollDownAnchor.current = scrollY;
      }
      if (
        scrollDownAnchor.current !== null &&
        scrollY - scrollDownAnchor.current > SCROLL_DOWN_THRESHOLD
      ) {
        if (isVisible) setIsVisible(false);
      }
    }
  }, [
    targetRect,
    workZoneRect,
    scrollY,
    scrollDirection,
    headerHeight,
    isVisible,
    isTransitionEnabled,
  ]);

  return {
    shouldRender: isVisible,
    isTransitionEnabled: isTransitionEnabled,
    placeholderHeight: targetRect?.height ?? 0,
    stickyStyles: {
      position: 'fixed',
      left: `${targetRect?.left ?? 0}px`,
      width: `${targetRect?.width ?? 0}px`,
      top: `${headerHeight}px`,
    },
  };
}
