'use client';

import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import StickyProductPageHeader from '@/components/layout/StickyProductPageHeader';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStickyHeader } from '@/context/StickyHeaderContext';
import { useSmartSticky } from '@/hooks/useSmartSticky';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью переписанный контроллер для главной страницы ---
const HomePageHeaderController = () => {
  const {
    headerStatus,
    headerHeight,
    setHeaderHeight,
    isSearchActive,
    setIsSearchActive,
    isMenuOpen,
    setIsMenuOpen,
  } = useStickyHeader();
  const originalHeaderRef = useRef<HTMLDivElement>(null);

  // 1. Измеряем высоту оригинальной шапки, когда она в DOM
  useLayoutEffect(() => {
    if (originalHeaderRef.current && !isSearchActive && !isMenuOpen) {
      const height = originalHeaderRef.current.offsetHeight;
      if (height > 0 && height !== headerHeight) {
        setHeaderHeight(height);
      }
    }
  }, [headerHeight, setHeaderHeight, isSearchActive, isMenuOpen]);

  // 2. Определяем видимость "липкой" шапки
  // Она видна, только когда статус 'pinned' (скролл вверх) или когда открыт поиск/меню
  const isStickyVisible =
    headerStatus === 'pinned' || isSearchActive || isMenuOpen;

  // 3. Анимация включена всегда, кроме самого начального состояния 'static'
  const isTransitionEnabled =
    headerStatus !== 'static' || isSearchActive || isMenuOpen;

  return (
    <>
      {/* 
        Это оригинальная шапка. Она всегда в потоке документа.
        Когда мы скроллим вниз, она просто уезжает вверх вместе со страницей.
        Когда мы скроллим вверх, она остается за экраном, а вместо нее появляется "липкая" шапка.
      */}
      <div ref={originalHeaderRef}>
        <Header
          isSearchActive={isSearchActive}
          onSearchToggle={setIsSearchActive}
          isMenuOpen={isMenuOpen}
          onMenuToggle={setIsMenuOpen}
        />
      </div>

      {/* 
        Это "липкая" шапка-клон. Она position: fixed.
        Она появляется только при скролле вверх (когда status === 'pinned').
      */}
      <div
        className={`fixed left-0 top-0 z-50 w-full ${
          isTransitionEnabled
            ? 'transition-transform duration-300 ease-in-out'
            : ''
        } ${isStickyVisible ? 'translate-y-0' : '-translate-y-full'} `}
        style={{ height: headerHeight > 0 ? `${headerHeight}px` : undefined }}
      >
        <Header
          isSearchActive={isSearchActive}
          onSearchToggle={setIsSearchActive}
          isMenuOpen={isMenuOpen}
          onMenuToggle={setIsMenuOpen}
        />
      </div>
    </>
  );
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const ProductPageHeaderController = () => {
  const originalHeaderRef = useRef<HTMLDivElement>(null);
  const [originalHeaderHeight, setOriginalHeaderHeight] = useState(0);
  const [isStickySessionActive, setIsStickySessionActive] = useState(false);
  const isSmartVisible = useSmartSticky();

  useLayoutEffect(() => {
    if (originalHeaderRef.current) {
      setOriginalHeaderHeight(originalHeaderRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (originalHeaderHeight === 0) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > originalHeaderHeight) {
        setIsStickySessionActive(true);
      } else if (scrollY < 10) {
        setIsStickySessionActive(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [originalHeaderHeight]);

  const isStickyVisible = isStickySessionActive && isSmartVisible;

  return (
    <>
      <div ref={originalHeaderRef}>
        <ProductPageHeader />
      </div>
      <StickyProductPageHeader
        isVisible={isStickyVisible}
        isTransitionEnabled={isStickySessionActive}
      />
    </>
  );
};

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { isSearchActive, setIsSearchActive, isMenuOpen, setIsMenuOpen } =
    useStickyHeader();

  if (isProductPage) {
    return <ProductPageHeaderController />;
  }

  if (isHomePage && !isDesktop) {
    return <HomePageHeaderController />;
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md">
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setIsSearchActive}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
      />
    </div>
  );
}
