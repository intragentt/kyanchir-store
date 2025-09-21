'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import StickyProductPageHeader from '@/components/layout/StickyProductPageHeader';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStickyHeader } from '@/context/StickyHeaderContext';
import { useSmartSticky } from '@/hooks/useSmartSticky';

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
        className={`fixed left-0 top-0 z-50 w-full ${
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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Убрана нижняя граница ---
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
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
