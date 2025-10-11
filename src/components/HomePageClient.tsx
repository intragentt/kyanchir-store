'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import CatalogContent from '@/components/CatalogContent';
import SmartStickyCategoryFilter from '@/components/SmartStickyCategoryFilter';
import { ProductWithInfo } from '@/lib/types';

const DEFAULT_HEADER_HEIGHT = 64;
const SCROLL_ALIGNMENT_TOLERANCE = 2;
const SCROLL_IDLE_DELAY = 140;
const SCROLL_FALLBACK_DELAY = 900;

const parsePxValue = (
  value: string | null | undefined,
  fallback: number,
): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type Category = {
  id: string;
  name: string;
};

interface HomePageClientProps {
  initialProducts: ProductWithInfo[];
  categories: Category[];
}

export default function HomePageClient({
  initialProducts,
  categories,
}: HomePageClientProps) {
  const [allProducts] = useState<ProductWithInfo[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] =
    useState<ProductWithInfo[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const scrollingToFilter = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollListenerRef = useRef<EventListener | null>(null);
  const loaderStartTimeRef = useRef<number | null>(null);
  const loaderMinDelayRef = useRef<NodeJS.Timeout | null>(null);
  const loaderMaxDelayRef = useRef<NodeJS.Timeout | null>(null);
  const [disableStickyClone, setDisableStickyClone] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      const handleTelegramLogin = async () => {
        const res = await signIn('telegram-credentials', {
          token,
          redirect: false,
        });
        if (res?.ok) {
          router.refresh();
        } else {
          console.error('Telegram login failed:', res?.error);
        }
      };
      handleTelegramLogin();
    }
  }, [searchParams, router]);

  useEffect(() => {
    let productsToFilter = [...allProducts];
    if (searchTerm.trim() !== '') {
      productsToFilter = productsToFilter.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (activeCategory !== 'all') {
      productsToFilter = productsToFilter.filter((product) =>
        product.categoryIds.includes(activeCategory),
      );
    }
    setFilteredProducts(productsToFilter);

    if (isCatalogLoading) {
      const MIN_LOADER_DURATION = 1000;

      if (loaderMinDelayRef.current) {
        clearTimeout(loaderMinDelayRef.current);
        loaderMinDelayRef.current = null;
      }

      const startedAt = loaderStartTimeRef.current;
      if (startedAt === null) {
        setIsCatalogLoading(false);
        loaderStartTimeRef.current = null;
        if (loaderMaxDelayRef.current) {
          clearTimeout(loaderMaxDelayRef.current);
          loaderMaxDelayRef.current = null;
        }
      } else {
        const elapsed = Date.now() - startedAt;

        if (elapsed >= MIN_LOADER_DURATION) {
          setIsCatalogLoading(false);
          loaderStartTimeRef.current = null;
          loaderMinDelayRef.current = null;
          if (loaderMaxDelayRef.current) {
            clearTimeout(loaderMaxDelayRef.current);
            loaderMaxDelayRef.current = null;
          }
        } else {
          loaderMinDelayRef.current = setTimeout(() => {
            setIsCatalogLoading(false);
            loaderStartTimeRef.current = null;
            loaderMinDelayRef.current = null;
            if (loaderMaxDelayRef.current) {
              clearTimeout(loaderMaxDelayRef.current);
              loaderMaxDelayRef.current = null;
            }
          }, MIN_LOADER_DURATION - elapsed);
        }
      }
    }
  }, [
    searchTerm,
    activeCategory,
    allProducts,
    isCatalogLoading,
  ]);

  const measureHeader = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        offset: 0,
        visible: false,
        height: DEFAULT_HEADER_HEIGHT,
        bannerOffset: 0,
      };
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

    const headerElement = document.querySelector<HTMLElement>(
      '[data-site-header-root]',
    );

    if (!headerElement) {
      const fallbackOffset = bannerOffset + fallbackHeight;
      return {
        offset: fallbackOffset,
        visible: fallbackOffset - bannerOffset > 0.5,
        height: fallbackHeight,
        bannerOffset,
      };
    }

    const rect = headerElement.getBoundingClientRect();
    const height = rect?.height;
    const bottom = rect?.bottom;

    const safeHeight =
      typeof height === 'number' && Number.isFinite(height)
        ? height
        : fallbackHeight;
    const safeBottom = Number.isFinite(bottom)
      ? Math.max(bannerOffset, bottom as number)
      : bannerOffset + safeHeight;

    return {
      offset: safeBottom,
      visible: safeBottom - bannerOffset > 0.5,
      height: safeHeight,
      bannerOffset,
    };
  }, []);

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (activeCategory === categoryId || scrollingToFilter.current) return;

      if (loaderMinDelayRef.current) {
        clearTimeout(loaderMinDelayRef.current);
        loaderMinDelayRef.current = null;
      }
      if (loaderMaxDelayRef.current) {
        clearTimeout(loaderMaxDelayRef.current);
        loaderMaxDelayRef.current = null;
      }

      loaderStartTimeRef.current = Date.now();
      setIsCatalogLoading(true);
      loaderMaxDelayRef.current = setTimeout(() => {
        setIsCatalogLoading(false);
        loaderStartTimeRef.current = null;
        if (loaderMinDelayRef.current) {
          clearTimeout(loaderMinDelayRef.current);
          loaderMinDelayRef.current = null;
        }
        loaderMaxDelayRef.current = null;
      }, 3000);
      setActiveCategory(categoryId);

      const container = filterContainerRef.current;
      if (!container) {
        return;
      }

      const { offset, visible, bannerOffset } = measureHeader();
      setDisableStickyClone(visible);

      const currentScroll = window.scrollY;
      const containerRect = container.getBoundingClientRect();
      const absoluteTop = currentScroll + containerRect.top;

      const headerClearance = Math.max(0, offset);
      const baselineClearance = Math.max(0, bannerOffset);
      const effectiveClearance = Math.max(headerClearance, baselineClearance);
      const destination = Math.max(0, absoluteTop - effectiveClearance);

      scrollingToFilter.current = true;

      const cleanupAfterScroll = () => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
          scrollTimeout.current = null;
        }
        if (scrollListenerRef.current) {
          window.removeEventListener('scroll', scrollListenerRef.current);
          scrollListenerRef.current = null;
        }
        scrollingToFilter.current = false;
        setDisableStickyClone(false);
      };

      function finalizeScroll() {
        const currentContainer = filterContainerRef.current;

        if (!currentContainer) {
          cleanupAfterScroll();
          return;
        }

        const { offset: currentOffset, bannerOffset: currentBannerOffset } =
          measureHeader();
        const desiredTop = Math.max(currentOffset, currentBannerOffset);
        const containerRect = currentContainer.getBoundingClientRect();
        const adjustment = desiredTop - containerRect.top;

        if (Math.abs(adjustment) > SCROLL_ALIGNMENT_TOLERANCE) {
          const nextScrollTop = Math.max(0, window.scrollY + adjustment);
          window.scrollTo({ top: nextScrollTop, behavior: 'auto' });
        }

        cleanupAfterScroll();
      }

      function scheduleFinalize(delay: number) {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(() => {
          finalizeScroll();
        }, delay);
      }

      const handleScrollEvent: EventListener = () => {
        scheduleFinalize(SCROLL_IDLE_DELAY);
      };

      scrollListenerRef.current = handleScrollEvent;
      window.addEventListener('scroll', handleScrollEvent, { passive: true });
      window.scrollTo({ top: destination, behavior: 'smooth' });
      scheduleFinalize(SCROLL_FALLBACK_DELAY);
    },
    [
      activeCategory,
      measureHeader,
    ],
  );

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current);
        scrollListenerRef.current = null;
      }
      if (loaderMinDelayRef.current) {
        clearTimeout(loaderMinDelayRef.current);
        loaderMinDelayRef.current = null;
      }
      if (loaderMaxDelayRef.current) {
        clearTimeout(loaderMaxDelayRef.current);
        loaderMaxDelayRef.current = null;
      }
      loaderStartTimeRef.current = null;
    };
  }, []);

  return (
    <>
      <div ref={filterContainerRef}>
        <SmartStickyCategoryFilter
          onSelectCategory={handleSelectCategory}
          activeCategory={activeCategory}
          className="mb-4"
          workZoneRef={productGridRef}
          categories={categories}
          disableStickyClone={disableStickyClone}
        />
      </div>
      <div ref={productGridRef} className="relative min-h-[200vh]">
        <CatalogContent products={filteredProducts} isLoading={isCatalogLoading} />
      </div>
    </>
  );
}
