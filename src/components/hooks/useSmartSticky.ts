// Местоположение: src/components/hooks/useSmartSticky.ts
// Метафора: "'Мозг' умного прилипания".
// Этот хук — сложная "система управления", которая в реальном времени
// анализирует обстановку (позицию элементов, направление скролла) и
// отдает команды компоненту, решая, должен ли "липкий клон" быть видимым.

import { useState, useEffect, RefObject, useRef } from 'react';
import { useElementRect } from './useElementRect';
import { useScrollInfo } from './useScrollInfo';

// "Константы поведения": пороги, определяющие чувствительность появления/скрытия.
const SCROLL_UP_THRESHOLD = 250; // Сколько нужно проскроллить ВВЕРХ, чтобы клон ПОЯВИЛСЯ.
const SCROLL_DOWN_THRESHOLD = 50; // Сколько нужно проскроллить ВНИЗ, чтобы клон СКРЫЛСЯ.

// "Контракты" хука: что он принимает и что возвращает.
export interface SmartStickyOptions {
  headerHeight: number; // Высота шапки над клоном.
}

export interface SmartStickyResult {
  shouldRender: boolean; // Команда: "рендерить клон или нет?"
  isTransitionEnabled: boolean; // Команда: "использовать плавную анимацию или нет?"
  placeholderHeight: number; // Размер "распорки" под оригиналом.
  stickyStyles: React.CSSProperties; // Стили для позиционирования клона.
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
  const { scrollY, scrollDirection } = useScrollInfo(); // Текущий скролл и направление.

  // --- ВНУТРЕННЕЕ СОСТОЯНИЕ "МОЗГА" ---
  const [isVisible, setIsVisible] = useState(false); // Видим ли клон сейчас?
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true); // Разрешены ли анимации?

  // --- "ПАМЯТЬ" ДЛЯ ЛОГИКИ ПОРОГОВ ---
  const scrollUpAnchor = useRef<number | null>(null); // "Якорь" для скролла вверх.
  const scrollDownAnchor = useRef<number | null>(null); // "Якорь" для скролла вниз.

  // --- ГЛАВНЫЙ "АНАЛИТИЧЕСКИЙ ЦЕНТР" ---
  // Этот useEffect — ядро хука. Он запускается при каждом изменении обстановки.
  useEffect(() => {
    if (!targetRect || !workZoneRect) return; // Ждем, пока все данные будут готовы.

    // --- ПРАВИЛО №1: БЕСШОВНАЯ "СТЫКОВКА" (САМОЕ ВАЖНОЕ) ---
    // Если верхняя граница ОРИГИНАЛА (`targetRect.top`) видна на экране
    // и достигла места, где должен сидеть КЛОН (`headerHeight`)...
    if (targetRect.top >= headerHeight) {
      // ...значит, клон свою задачу выполнил. Он должен исчезнуть.
      if (isVisible) {
        setIsVisible(false);
        // Ключевой трюк: ОТКЛЮЧАЕМ анимацию, чтобы исчезновение было
        // абсолютно мгновенным и бесшовным в момент "стыковки".
        setIsTransitionEnabled(false);
      }
      // Сбрасываем якоря, так как мы в "безопасной зоне".
      scrollUpAnchor.current = null;
      scrollDownAnchor.current = null;
      return; // Выходим. Остальная логика не нужна, т.к. оригинал на месте.
    }

    // Если мы прошли точку стыковки (скроллим вниз), снова включаем анимации.
    if (!isTransitionEnabled) {
      setIsTransitionEnabled(true);
    }

    // --- ПРАВИЛО №2: "РАБОЧАЯ ЗОНА" ---
    // Проверяем, что мы не вышли за пределы зоны, где клон вообще имеет смысл.
    const workZoneBottom = workZoneRect.top + scrollY + workZoneRect.height;
    const isInsideWorkZone = scrollY < workZoneBottom - headerHeight;
    if (!isInsideWorkZone) {
      if (isVisible) setIsVisible(false); // Если вышли из зоны, скрываем клон.
      return;
    }

    // --- ПРАВИЛО №3: "ПРАВИЛА ДВИЖЕНИЯ" (ЛОГИКА СКРЫТИЯ/ПОЯВЛЕНИЯ) ---
    if (scrollDirection === 'up') {
      scrollDownAnchor.current = null; // Сбрасываем якорь другого направления.
      if (scrollUpAnchor.current === null) {
        scrollUpAnchor.current = scrollY; // Ставим "якорь" в текущей точке.
      }
      // Если отъехали от якоря вверх на нужное расстояние...
      if (
        scrollUpAnchor.current !== null &&
        scrollUpAnchor.current - scrollY > SCROLL_UP_THRESHOLD
      ) {
        if (!isVisible) setIsVisible(true); // ...показываем клон.
      }
    } else if (scrollDirection === 'down') {
      scrollUpAnchor.current = null; // Сбрасываем якорь другого направления.
      if (scrollDownAnchor.current === null) {
        scrollDownAnchor.current = scrollY; // Ставим "якорь" в текущей точке.
      }
      // Если отъехали от якоря вниз на нужное расстояние...
      if (
        scrollDownAnchor.current !== null &&
        scrollY - scrollDownAnchor.current > SCROLL_DOWN_THRESHOLD
      ) {
        if (isVisible) setIsVisible(false); // ...прячем клон.
      }
    }
    // Этот гигантский массив зависимостей заставляет хук перепроверять
    // обстановку при любом значимом изменении.
  }, [
    targetRect,
    workZoneRect,
    scrollY,
    scrollDirection,
    headerHeight,
    isVisible,
    isTransitionEnabled,
  ]);

  // --- ВОЗВРАЩАЕМЫЕ "КОМАНДЫ" ---
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
