// Местоположение: src/components/hooks/useSmartSticky.ts
// Метафора: "'Мозг' умного прилипания".
// Этот хук анализирует обстановку (позицию элементов, направление скролла)
// и решает, должен ли "липкий клон" быть видимым и смещённым за пределы экрана.

import { useState, useEffect, type RefObject, type CSSProperties } from 'react';
import { useElementRect } from './useElementRect';
import { useScrollInfo } from './useScrollInfo';

// "Контракты" хука: что он принимает и что возвращает.
export interface SmartStickyOptions {
  headerOffset: number; // Текущий отступ от верхней границы окна до низа шапки/баннеров.
  renderAllowed: boolean; // Разрешено ли отображение клона (например, при автоскролле мы его скрываем).
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
  const { headerOffset, renderAllowed } = options;

  // --- СБОР ДАННЫХ В РЕАЛЬНОМ ВРЕМЕНИ ---
  const targetRect = useElementRect(targetRef); // Размеры и позиция "оригинала".
  const workZoneRect = useElementRect(workZoneRef); // Размеры и позиция "рабочей зоны".
  const { scrollY } = useScrollInfo(); // Текущий скролл.

  // --- ВНУТРЕННЕЕ СОСТОЯНИЕ "МОЗГА" ---
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Видим ли клон сейчас?
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false); // Разрешены ли анимации?

  // --- ГЛАВНЫЙ "АНАЛИТИЧЕСКИЙ ЦЕНТР" ---
  // Этот useEffect — ядро хука. Он запускается при каждом изменении обстановки.
  useEffect(() => {
    if (!renderAllowed) {
      setShouldRender(false);
      setIsVisible(false);
      setIsTransitionEnabled(false);
      return;
    }

    if (!targetRect || !workZoneRect) {
      return; // Ждем, пока все данные будут готовы.
    }

    const hasReachedStickPoint = targetRect.top <= headerOffset + 0.5;
    const workZoneBottom = workZoneRect.top + scrollY + workZoneRect.height;
    const isInsideWorkZone = scrollY + Math.max(headerOffset, 0) < workZoneBottom - 0.5;

    const shouldStick = hasReachedStickPoint && isInsideWorkZone;

    setShouldRender(shouldStick);
    setIsVisible(shouldStick);
    setIsTransitionEnabled(shouldStick);
    // Этот массив зависимостей заставляет хук перепроверять обстановку при любом значимом изменении.
  }, [
    targetRect,
    workZoneRect,
    scrollY,
    headerOffset,
    renderAllowed,
  ]);

  // --- ВОЗВРАЩАЕМЫЕ "КОМАНДЫ" ---
  return {
    shouldRender,
    isTransitionEnabled,
    isVisible,
    placeholderHeight: targetRect?.height ?? 0,
    stickyStyles: {
      position: 'fixed',
      left: `${targetRect?.left ?? 0}px`,
      width: `${targetRect?.width ?? 0}px`,
      top: `${Math.max(headerOffset, 0)}px`,
    },
  };
}
