// Местоположение: src/components/SmartStickyCategoryFilter.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import CategoryFilter from './CategoryFilter';
import { useSmartSticky } from './hooks/useSmartSticky';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем мертвый импорт ---
// import { useStickyHeader } from '@/context/StickyHeaderContext';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Заменяем логику из контекста на временную константу ---
  // Так как StickyHeaderContext удален, мы временно используем
  // предполагаемую высоту шапки. Это позволит компоненту работать.
  const topOffset = 64; // Примерная высота шапки в пикселях
  const filterRef = useRef<HTMLDivElement>(null);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

  const stickyWrapperClasses = [
    'fixed w-full z-40 bg-white',
    isTransitionEnabled ? 'transition-all duration-300 ease-in-out' : '',
    isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
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

      {isMounted && (
        <div
          style={stickyStyles}
          className={`${stickyWrapperClasses} py-3`}
          aria-hidden="true"
        >
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
