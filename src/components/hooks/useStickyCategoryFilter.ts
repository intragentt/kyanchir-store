// Местоположение: src/components/hooks/useSmartSticky.ts

import { useState, useEffect, RefObject, useRef } from 'react';
import { useElementRect } from './useElementRect';
import { useScrollInfo } from './useScrollInfo';

// --- ГЛАВНОЕ ИЗМЕНЕНИЕ: Увеличиваем порог до высоты карточки товара ---
// Высота одной карточки примерно 250-300px. Поставим 250.
const STICKY_THRESHOLD = 250; // Было 150, стало 250

export interface SmartStickyOptions {
  headerHeight: number;
}

export interface SmartStickyResult {
  shouldRender: boolean;
  isDocked: boolean;
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
  const scrollAnchorY = useRef(0);

  useEffect(() => {
    if (!targetRect || !workZoneRect) return;

    // Правило №1: Стыковка (самый высокий приоритет)
    if (targetRect.top >= headerHeight) {
      if (isVisible) setIsVisible(false);
      return;
    }

    // Правило №2: Рабочая зона
    const isInsideWorkZone =
      scrollY < workZoneRect.bottom + scrollY - headerHeight;
    if (!isInsideWorkZone) {
      if (isVisible) setIsVisible(false);
      return;
    }

    // Правило №3: Логика с порогом срабатывания
    if (scrollDirection === 'down') {
      scrollAnchorY.current = scrollY;
      if (isVisible) setIsVisible(false);
    } else if (scrollDirection === 'up') {
      if (!isVisible && scrollAnchorY.current - scrollY > STICKY_THRESHOLD) {
        setIsVisible(true);
      }
    }
  }, [
    targetRect,
    workZoneRect,
    scrollY,
    scrollDirection,
    headerHeight,
    isVisible,
  ]);

  const isDocked = targetRect ? targetRect.top >= headerHeight : false;

  return {
    shouldRender: isVisible,
    isDocked: isDocked,
    placeholderHeight: targetRect?.height ?? 0,
    stickyStyles: {
      position: 'fixed',
      top: 0,
      left: targetRect?.left ?? 0,
      width: targetRect?.width ?? 0,
    },
  };
}
