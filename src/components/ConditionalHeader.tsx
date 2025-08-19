// Местоположение: src/components/ConditionalHeader.tsx
'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import StickyProductPageHeader from '@/components/layout/StickyProductPageHeader';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStickyHeader } from '@/context/StickyHeaderContext';
import { useSmartSticky } from '@/hooks/useSmartSticky';

// Контроллер для Главной страницы (остается без изменений)
const HomePageHeaderController = () => {
  // ... (код без изменений)
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
    if (originalHeaderRef.current && !isSearchActive && !isMenuOpen) {
      const height = originalHeaderRef.current.offsetHeight;
      if (height > 0 && height !== headerHeight) {
        setHeaderHeight(height);
      }
    }
  }, [headerHeight, setHeaderHeight, isSearchActive, isMenuOpen]);

  const isStickyVisible =
    headerStatus === 'pinned' || isSearchActive || isMenuOpen;
  const isTransitionEnabled =
    headerStatus !== 'static' || isSearchActive || isMenuOpen;

  return (
    <>
      <div ref={originalHeaderRef}>
        <Header
          isSearchActive={isSearchActive}
          onSearchToggle={setIsSearchActive}
          isMenuOpen={isMenuOpen}
          onMenuToggle={setIsMenuOpen}
        />
      </div>
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

// --- НАЧАЛО ИЗМЕНЕНИЙ: Улучшенный контроллер для страницы товара с "логикой защёлки" ---
const ProductPageHeaderController = () => {
  const originalHeaderRef = useRef<HTMLDivElement>(null);
  const [originalHeaderHeight, setOriginalHeaderHeight] = useState(0);
  // Новое состояние-"защёлка": активно ли в принципе "липкое" состояние
  const [isStickySessionActive, setIsStickySessionActive] = useState(false);

  // Наш хук для показа/скрытия, когда "липкое" состояние активно
  const isSmartVisible = useSmartSticky();

  // 1. Измеряем высоту оригинальной шапки
  useLayoutEffect(() => {
    if (originalHeaderRef.current) {
      setOriginalHeaderHeight(originalHeaderRef.current.offsetHeight);
    }
  }, []);

  // 2. Управляем состоянием-"защёлкой"
  useEffect(() => {
    // Не запускаем логику, пока не измерили высоту
    if (originalHeaderHeight === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Если мы проскроллили ниже оригинальной шапки - "защёлкиваем" липкий режим
      if (scrollY > originalHeaderHeight) {
        setIsStickySessionActive(true);
      }
      // А "отщёлкиваем" его, только когда вернулись почти к самому верху
      else if (scrollY < 10) {
        setIsStickySessionActive(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [originalHeaderHeight]); // Зависимость от высоты, чтобы сработать после измерения

  // 3. Финальное решение о видимости:
  // Шапка видна, если "сессия" активна И "умный" хук дал команду на показ
  const isStickyVisible = isStickySessionActive && isSmartVisible;

  return (
    <>
      {/* Оригинальная шапка, которая остается в потоке документа */}
      <div ref={originalHeaderRef}>
        <ProductPageHeader />
      </div>

      {/* "Умная" липкая шапка-клон */}
      <StickyProductPageHeader
        isVisible={isStickyVisible}
        // Анимация всегда включена, когда активна "липкая сессия"
        isTransitionEnabled={isStickySessionActive}
      />
    </>
  );
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

// Главный компонент-маршрутизатор (остается без изменений)
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
    <Header
      isSearchActive={isSearchActive}
      onSearchToggle={setIsSearchActive}
      isMenuOpen={isMenuOpen}
      onMenuToggle={setIsMenuOpen}
    />
  );
}
