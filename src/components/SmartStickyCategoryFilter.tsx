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
  activeCategory?: string;
  className?: string;
  workZoneRef: React.RefObject<HTMLElement | null>;
  categories: Category[];
}

export default function SmartStickyCategoryFilter({
  onSelectCategory,
  activeCategory = 'all',
  className = '',
  workZoneRef,
  categories,
}: SmartStickyCategoryFilterProps) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [stickyOffset, setStickyOffset] = useState(() => 64);

  const handleScroll = useCallback((scrollOffset: number) => {
    setScrollLeft(scrollOffset);
  }, []);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Управляем отступом от шапки динамически ---
  const DEFAULT_HEADER_HEIGHT = 64;
  const parsePxValue = (value: string | null | undefined, fallback: number) => {
    if (!value) {
      return fallback;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let resizeObserver: ResizeObserver | null = null;
    let observedHeader: Element | null = null;

    const computeOffset = () => {
      const headerElement = document.querySelector<HTMLElement>(
        '[data-site-header-root]',
      );

      if (
        headerElement &&
        headerElement !== observedHeader &&
        typeof ResizeObserver !== 'undefined'
      ) {
        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(() => computeOffset());
        resizeObserver.observe(headerElement);
        observedHeader = headerElement;
      }

      const headerHeight = headerElement?.getBoundingClientRect().height;
      const safeHeaderHeight =
        Number.isFinite(headerHeight) && headerHeight
          ? (headerHeight as number)
          : DEFAULT_HEADER_HEIGHT;

      const rootStyles = getComputedStyle(document.documentElement);
      const bannerOffset = parsePxValue(
        rootStyles.getPropertyValue('--site-mode-banner-offset'),
        0,
      );

      const nextOffset = Math.max(0, safeHeaderHeight + bannerOffset);

      setStickyOffset((current) =>
        Math.abs(current - nextOffset) > 0.5 ? nextOffset : current,
      );
    };

    const handleResize = () => computeOffset();
    window.addEventListener('resize', handleResize);

    const mutationObserver = new MutationObserver(() => computeOffset());
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const rafId = window.requestAnimationFrame(computeOffset);

    return () => {
      window.removeEventListener('resize', handleResize);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }, []);
  const filterRef = useRef<HTMLDivElement>(null);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const {
    shouldRender,
    isTransitionEnabled,
    isVisible,
    placeholderHeight,
    stickyStyles,
  } = useSmartSticky(filterRef, workZoneRef, { headerHeight: stickyOffset });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (shouldRender) {
      setIsMounted(true);
      return;
    }

    if (!isTransitionEnabled || !isVisible) {
      setIsMounted(false);
      return;
    }

    const timer = setTimeout(() => setIsMounted(false), 220);
    return () => clearTimeout(timer);
  }, [shouldRender, isTransitionEnabled, isVisible]);

  const stickyWrapperClasses = [
    'fixed w-full z-40 bg-white',
    isTransitionEnabled
      ? 'transition-transform transition-opacity duration-200 ease-out'
      : '',
    isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        ref={filterRef}
        style={{
          height: shouldRender || isMounted ? placeholderHeight : 'auto',
        }}
        className={`w-full bg-white ${className}`}
      >
        <CategoryFilter
          onSelectCategory={onSelectCategory}
          activeCategory={activeCategory}
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
              activeCategory={activeCategory}
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
