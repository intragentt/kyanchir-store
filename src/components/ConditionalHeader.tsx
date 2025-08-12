// Местоположение: src/components/ConditionalHeader.tsx
'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import StickyProductPageHeader from '@/components/layout/StickyProductPageHeader';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStickyHeader } from '@/context/StickyHeaderContext';

// Контроллер для Главной страницы
const HomePageHeaderController = () => {
  // --- ИЗМЕНЕНИЕ: Получаем управление и для МЕНЮ из "мозгового центра" ---
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

  useLayoutEffect(() => {
    // Не измеряем высоту, если открыт поиск или меню, чтобы избежать "прыжков"
    if (originalHeaderRef.current && !isSearchActive && !isMenuOpen) {
      const height = originalHeaderRef.current.offsetHeight;
      if (height > 0 && height !== headerHeight) {
        setHeaderHeight(height);
      }
    }
  }, [headerHeight, setHeaderHeight, isSearchActive, isMenuOpen]);

  // Шапка видна, если она "прилеплена" ИЛИ активен поиск, ИЛИ открыто меню
  const isStickyVisible =
    headerStatus === 'pinned' || isSearchActive || isMenuOpen;
  const isTransitionEnabled =
    headerStatus !== 'static' || isSearchActive || isMenuOpen;

  return (
    <>
      {/* 1. ОРИГИНАЛ: Передаем ему полное управление */}
      <div ref={originalHeaderRef}>
        <Header
          isSearchActive={isSearchActive}
          onSearchToggle={setIsSearchActive}
          isMenuOpen={isMenuOpen}
          onMenuToggle={setIsMenuOpen}
        />
      </div>

      {/* 2. КЛОН: Также передаем ему все команды */}
      <div
        className={`fixed top-0 left-0 z-50 w-full ${
          isTransitionEnabled
            ? 'transition-transform duration-300 ease-in-out'
            : ''
        } ${isStickyVisible ? 'translate-y-0' : '-translate-y-full'} `}
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

// Контроллер для страницы товара (остается без изменений)
const ProductPageHeaderController = () => {
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const originalHeaderRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollUpStartPosition = useRef<number | null>(null);
  const SCROLL_UP_THRESHOLD = 50;
  const ACTIVATION_OFFSET = 120;
  useEffect(() => {
    const originalStyle = document.body.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = 'contain';
    return () => {
      document.body.style.overscrollBehaviorY = originalStyle;
    };
  }, []);
  useEffect(() => {
    const originalHeaderElement = originalHeaderRef.current;
    if (!originalHeaderElement) return;
    const originalHeaderTopPosition = originalHeaderElement.offsetTop;
    const activationPoint =
      originalHeaderElement.offsetHeight + ACTIVATION_OFFSET;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY <= originalHeaderTopPosition) {
        setIsStickyVisible(false);
        setIsTransitionEnabled(false);
        return;
      }
      setIsTransitionEnabled(true);
      if (scrollY > activationPoint) {
        if (scrollY < lastScrollY.current) {
          if (scrollUpStartPosition.current === null) {
            scrollUpStartPosition.current = lastScrollY.current;
          }
          if (scrollUpStartPosition.current - scrollY > SCROLL_UP_THRESHOLD) {
            setIsStickyVisible(true);
          }
        } else {
          setIsStickyVisible(false);
          scrollUpStartPosition.current = null;
        }
      }
      lastScrollY.current = scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <>
      <div ref={originalHeaderRef}>
        <ProductPageHeader />
      </div>
      <StickyProductPageHeader
        isVisible={isStickyVisible}
        isTransitionEnabled={isTransitionEnabled}
      />
    </>
  );
};

// Главный компонент-маршрутизатор
export default function ConditionalHeader() {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { isSearchActive, setIsSearchActive, isMenuOpen, setIsMenuOpen } =
    useStickyHeader();

  // Для всех случаев, кроме страницы товара, мы передаем полное управление
  if (isProductPage) {
    return <ProductPageHeaderController />;
  }

  // На мобильной версии главной страницы используем специальный контроллер
  if (isHomePage && !isDesktop) {
    return <HomePageHeaderController />;
  }

  // Для всех остальных случаев (десктоп, другие страницы) используем обычный Header
  return (
    <Header
      isSearchActive={isSearchActive}
      onSearchToggle={setIsSearchActive}
      isMenuOpen={isMenuOpen}
      onMenuToggle={setIsMenuOpen}
    />
  );
}
