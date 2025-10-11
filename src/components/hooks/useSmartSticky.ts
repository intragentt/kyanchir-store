// Местоположение: src/components/hooks/useSmartSticky.ts
// Метафора: "'Мозг' умного прилипания".
// Этот хук анализирует обстановку (позицию элементов, направление скролла)
// и решает, должен ли "липкий клон" быть видимым и смещённым за пределы экрана.

import {
  useState,
  useEffect,
  useRef,
  type RefObject,
  type CSSProperties,
} from 'react';
import { useElementRect } from './useElementRect';
import { useScrollInfo } from './useScrollInfo';

const SCROLL_DELTA_THRESHOLD = 2;
const SCROLL_STOP_DELAY = 160;

// "Контракты" хука: что он принимает и что возвращает.
export interface SmartStickyOptions {
  headerHeight: number; // Высота шапки над клоном.
}

export interface SmartStickyResult {
  shouldRender: boolean; // Команда: "рендерить клон или нет?"
  isTransitionEnabled: boolean; // Команда: "использовать плавную анимацию или нет?"
  isVisible: boolean; // Команда: "показывать клон или прятать его за пределами экрана?"
  placeholderHeight: number; // Размер "распорки" под оригиналом.
  stickyStyles: CSSProperties; // Стили для позиционирования клона.
}

export function useSmartSticky(
  targetRef: RefObject<HTMLElement | null>, // Ссылка на "оригинал".
  workZoneRef: RefObject<HTMLElement | null>, // Ссылка на "рабочую зону".
  options: SmartStickyOptions,
): SmartStickyResult {
  const { headerHeight } = options;

  // --- СБОР ДАННЫХ В РЕАЛЬНОМ ВРЕМЕНИ ---
  const targetRect = useElementRect(targetRef); // Размеры и позиция "оригинала".
  const workZoneRect = useElementRect(workZoneRef); // Размеры и позиция "рабочей зоны".
  const { scrollY } = useScrollInfo(); // Текущий скролл.

  // --- ВНУТРЕННЕЕ СОСТОЯНИЕ "МОЗГА" ---
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Видим ли клон сейчас?
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true); // Разрешены ли анимации?

  const previousScrollYRef = useRef<number | null>(null);
  const scrollStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- ГЛАВНЫЙ "АНАЛИТИЧЕСКИЙ ЦЕНТР" ---
  // Этот useEffect — ядро хука. Он запускается при каждом изменении обстановки.
  useEffect(() => {
    if (!targetRect || !workZoneRect) return; // Ждем, пока все данные будут готовы.

    const previousScrollY = previousScrollYRef.current ?? scrollY;
    previousScrollYRef.current = scrollY;

    const isOriginalVisible = targetRect.top >= headerHeight;
    const workZoneBottom = workZoneRect.top + scrollY + workZoneRect.height;
    const isInsideWorkZone = scrollY < workZoneBottom - headerHeight;

    if (isOriginalVisible || !isInsideWorkZone) {
      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
        scrollStopTimeoutRef.current = null;
      }

      if (isVisible) {
        setIsVisible(false);
      }

      if (shouldRender) {
        setShouldRender(false);
      }

      if (isOriginalVisible && isTransitionEnabled) {
        setIsTransitionEnabled(false);
      }

      return;
    }

    if (!shouldRender) {
      setShouldRender(true);
    }

    if (!isTransitionEnabled) {
      setIsTransitionEnabled(true);
    }

    const delta = scrollY - previousScrollY;

    if (Math.abs(delta) > SCROLL_DELTA_THRESHOLD) {
      if (delta < 0 && !isVisible) {
        setIsVisible(true);
      } else if (delta > 0 && isVisible) {
        setIsVisible(false);
      }
    }

    if (scrollStopTimeoutRef.current) {
      clearTimeout(scrollStopTimeoutRef.current);
    }

    scrollStopTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, SCROLL_STOP_DELAY);
    // Этот массив зависимостей заставляет хук перепроверять обстановку при любом значимом изменении.
  }, [
    targetRect,
    workZoneRect,
    scrollY,
    headerHeight,
    isVisible,
    isTransitionEnabled,
    shouldRender,
  ]);

  useEffect(() => {
    return () => {
      if (scrollStopTimeoutRef.current) {
        clearTimeout(scrollStopTimeoutRef.current);
      }
    };
  }, []);

  // --- ВОЗВРАЩАЕМЫЕ "КОМАНДЫ" ---
  return {
    shouldRender,
    isTransitionEnabled: isTransitionEnabled,
    isVisible,
    placeholderHeight: targetRect?.height ?? 0,
    stickyStyles: {
      position: 'fixed',
      left: `${targetRect?.left ?? 0}px`,
      width: `${targetRect?.width ?? 0}px`,
      top: `${headerHeight}px`,
    },
  };
}
