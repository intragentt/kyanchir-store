// Местоположение: src/components/SmartStickyCategoryFilter.tsx
// Метафора: "Архитектор Full-Bleed Верстки".
// Мы возвращаем правильную архитектуру для "клона": полноэкранная
// белая подложка (`position: fixed`) и вложенный в нее `div.container`,
// который выравнивает сам фильтр по основной сетке сайта.

import React, { useRef, useState, useEffect, useCallback } from 'react';
import CategoryFilter from './CategoryFilter';
import { useSmartSticky } from './hooks/useSmartSticky';
import { useStickyHeader } from '@/context/StickyHeaderContext';

type Category = {
  id: string;
  name: string;
};

interface SmartStickyCategoryFilterProps {
  onSelectCategory: (categoryId: string) => void;
  initialCategory?: string;
  className?: string;
  workZoneRef: React.RefObject<HTMLElement | null>;
  categories: Category[];
}

export default function SmartStickyCategoryFilter({
  onSelectCategory,
  initialCategory = 'all',
  className = '',
  workZoneRef,
  categories,
}: SmartStickyCategoryFilterProps) {
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = useCallback((scrollOffset: number) => {
    setScrollLeft(scrollOffset);
  }, []);

  const { headerStatus, headerHeight } = useStickyHeader();
  const filterRef = useRef<HTMLDivElement>(null);
  const topOffset = headerStatus === 'pinned' ? headerHeight : 0;

  const { shouldRender, isTransitionEnabled, placeholderHeight, stickyStyles } =
    useSmartSticky(filterRef, workZoneRef, { headerHeight: topOffset });

  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (shouldRender) {
      setIsMounted(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      if (!isTransitionEnabled) {
        setIsMounted(false);
      } else {
        const timer = setTimeout(() => setIsMounted(false), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [shouldRender, isTransitionEnabled]);

  // Внешняя обертка теперь снова w-full, чтобы фон был на всю ширину.
  const stickyWrapperClasses = [
    'fixed w-full z-40 bg-white',
    isTransitionEnabled ? 'transition-all duration-300 ease-in-out' : '',
    isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* "Оригинальный" фильтр (без изменений) */}
      <div
        ref={filterRef}
        style={{ height: shouldRender ? placeholderHeight : 'auto' }}
        className={`w-full bg-white ${className}`}
      >
        <CategoryFilter
          onSelectCategory={onSelectCategory}
          activeCategory={initialCategory}
          categories={categories}
          scrollLeft={scrollLeft}
          onScroll={handleScroll}
        />
      </div>

      {/* --- ОБНОВЛЕННЫЙ "Липкий клон" с Full-Bleed версткой --- */}
      {isMounted && (
        // Шаг 1: Эта обертка — полноэкранная белая подложка.
        <div
          style={stickyStyles}
          className={`${stickyWrapperClasses} py-3`}
          aria-hidden="true"
        >
          {/* Шаг 2: Внутрь добавляем стандартный контейнер для выравнивания контента. */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <CategoryFilter
              onSelectCategory={onSelectCategory}
              activeCategory={initialCategory}
              categories={categories}
              scrollLeft={scrollLeft}
              onScroll={handleScroll}
              disableCentering={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
