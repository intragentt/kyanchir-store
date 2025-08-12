import React, { useRef, useState, useEffect } from 'react';
import CategoryFilter from './CategoryFilter';
import { useSmartSticky } from './hooks/useSmartSticky';
import { useStickyHeader } from '@/context/StickyHeaderContext';

interface SmartStickyCategoryFilterProps {
  onSelectCategory: (categoryId: string) => void;
  initialCategory?: string;
  className?: string;
  workZoneRef: React.RefObject<HTMLElement | null>;
}

export default function SmartStickyCategoryFilter({
  onSelectCategory,
  initialCategory = 'all',
  className = '',
  workZoneRef,
}: SmartStickyCategoryFilterProps) {
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
      // Если анимация ОТКЛЮЧЕНА (при стыковке), убираем компонент мгновенно.
      if (!isTransitionEnabled) {
        setIsMounted(false);
      } else {
        // Иначе — ждем завершения анимации.
        const timer = setTimeout(() => setIsMounted(false), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [shouldRender, isTransitionEnabled]);

  const stickyWrapperClasses = [
    'fixed w-full z-40 bg-white',
    // Применяем класс transition, только если анимация РАЗРЕШЕНА.
    isTransitionEnabled ? 'transition-all duration-300 ease-in-out' : '',
    isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        ref={filterRef}
        // Устанавливаем высоту-заполнитель, только когда клон должен появиться
        style={{ height: shouldRender ? placeholderHeight : 'auto' }}
        className={`w-full bg-white ${className}`}
      >
        <CategoryFilter
          onSelectCategory={onSelectCategory}
          activeCategory={initialCategory}
        />
      </div>

      {isMounted && (
        <div
          style={stickyStyles}
          className={stickyWrapperClasses}
          aria-hidden="true"
        >
          <div className="py-3">
            <CategoryFilter
              onSelectCategory={onSelectCategory}
              activeCategory={initialCategory}
            />
          </div>
        </div>
      )}
    </>
  );
}
