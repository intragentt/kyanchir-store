// Местоположение: src/components/SmartStickyCategoryFilter.tsx
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type CSSProperties,
} from 'react';
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
  disableStickyClone?: boolean;
}

export default function SmartStickyCategoryFilter({
  onSelectCategory,
  activeCategory = 'all',
  className = '',
  workZoneRef,
  categories,
  disableStickyClone = false,
}: SmartStickyCategoryFilterProps) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [headerMetrics, setHeaderMetrics] = useState(() => ({
    offset: 64,
    visible: true,
    height: 64,
  }));

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
    let observedHeader: HTMLElement | null = null;
    let headerMutationObserver: MutationObserver | null = null;
    let rafId: number | null = null;

    const scheduleUpdate = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        computeOffset();
      });
    };

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

        if (!headerMutationObserver) {
          headerMutationObserver = new MutationObserver(() => scheduleUpdate());
        }
        headerMutationObserver.disconnect();
        headerMutationObserver.observe(headerElement, {
          attributes: true,
          attributeFilter: ['style', 'class'],
        });
      }

      const rootStyles = getComputedStyle(document.documentElement);
      const bannerOffset = parsePxValue(
        rootStyles.getPropertyValue('--site-mode-banner-offset'),
        0,
      );
      const fallbackHeight = parsePxValue(
        rootStyles.getPropertyValue('--header-height'),
        DEFAULT_HEADER_HEIGHT,
      );

      let safeHeaderHeight = fallbackHeight;
      let visualBottom = bannerOffset + fallbackHeight;

      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        const headerHeight = rect?.height;
        if (Number.isFinite(headerHeight) && headerHeight) {
          safeHeaderHeight = headerHeight as number;
        }

        const bottom = rect?.bottom;
        if (Number.isFinite(bottom)) {
          visualBottom = Math.max(bannerOffset, bottom as number);
        } else {
          visualBottom = bannerOffset + safeHeaderHeight;
        }
      }

      const isHeaderVisible = visualBottom - bannerOffset > 0.5;

      setHeaderMetrics((current) => {
        const offsetDiff = Math.abs(current.offset - visualBottom);
        const heightDiff = Math.abs(current.height - safeHeaderHeight);
        if (
          offsetDiff <= 0.5 &&
          heightDiff <= 0.5 &&
          current.visible === isHeaderVisible
        ) {
          return current;
        }

        return {
          offset: visualBottom,
          height: safeHeaderHeight,
          visible: isHeaderVisible,
        };
      });
    };

    const handleResize = () => scheduleUpdate();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });

    const mutationObserver = new MutationObserver(() => scheduleUpdate());
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });

    scheduleUpdate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      headerMutationObserver?.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
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
  } = useSmartSticky(filterRef, workZoneRef, {
    headerOffset: headerMetrics.offset,
    headerVisible: headerMetrics.visible && !disableStickyClone,
  });

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

  const shouldHideOriginal = shouldRender;

  const originalWrapperStyle: CSSProperties = {
    height: shouldRender || isMounted ? placeholderHeight : 'auto',
    opacity: shouldHideOriginal ? 0 : 1,
    pointerEvents: shouldHideOriginal ? 'none' : 'auto',
    transition: 'opacity 0.2s ease',
  };

  return (
    <>
      <div
        ref={filterRef}
        style={originalWrapperStyle}
        className={`w-full bg-white ${className}`}
        aria-hidden={shouldHideOriginal || undefined}
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
          aria-hidden={!shouldHideOriginal || undefined}
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
