// Местоположение: src/app/layout.tsx
'use client';

import './globals.css';
import { fontHeading, fontBody, fontMono } from './fonts';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  StickyHeaderContext,
  HeaderStatus,
} from '@/context/StickyHeaderContext';

import DynamicHeroSection from '@/components/DynamicHeroSection';
import ConditionalHeader from '@/components/ConditionalHeader';
import Footer from '@/components/Footer';
import ClientInteractivity from '@/components/ClientInteractivity';
import SearchOverlay from '@/components/SearchOverlay';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [headerStatus, setHeaderStatus] = useState<HeaderStatus>('static');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Состояние меню теперь тоже здесь

  const lastScrollY = useRef(0);
  const scrollLockPosition = useRef(0);
  const isLockingScroll = useRef(false);

  const SCROLL_UP_THRESHOLD = 800;
  const SCROLL_DOWN_THRESHOLD = 50;
  const scrollUpAnchor = useRef<number | null>(null);
  const scrollDownAnchor = useRef<number | null>(null);

  // ЕДИНЫЙ обработчик блокировки скролла для МЕНЮ и ПОИСКА
  useEffect(() => {
    const shouldLock = isSearchActive || isMenuOpen;
    isLockingScroll.current = true;

    if (shouldLock) {
      scrollLockPosition.current = window.scrollY;
      const body = document.body;
      body.style.position = 'fixed';
      body.style.width = '100%';
      body.style.top = `-${scrollLockPosition.current}px`;
      body.style.overscrollBehaviorY = 'contain';
    } else {
      const body = document.body;
      const scrollY = body.style.top;
      body.style.position = '';
      body.style.width = '';
      body.style.top = '';
      body.style.overscrollBehaviorY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    const timer = setTimeout(() => {
      isLockingScroll.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [isSearchActive, isMenuOpen]);

  // Обработчик скролла для "липкой" шапки
  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      if (isLockingScroll.current || isSearchActive || isMenuOpen) {
        return;
      }
      if (headerHeight === 0) return;

      const scrollY = window.scrollY;
      const isScrollingUp = scrollY < lastScrollY.current;

      if (scrollY < 1) {
        setHeaderStatus('static');
        return;
      }

      if (isScrollingUp) {
        scrollDownAnchor.current = null;
        if (scrollUpAnchor.current === null)
          scrollUpAnchor.current = lastScrollY.current;
        if (scrollUpAnchor.current - scrollY > SCROLL_UP_THRESHOLD)
          setHeaderStatus('pinned');
      } else {
        scrollUpAnchor.current = null;
        if (scrollDownAnchor.current === null)
          scrollDownAnchor.current = lastScrollY.current;
        if (scrollY - scrollDownAnchor.current > SCROLL_DOWN_THRESHOLD)
          setHeaderStatus('unpinned');
      }
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, headerHeight, isSearchActive, isMenuOpen]);

  const contextValue = {
    headerStatus,
    headerHeight,
    setHeaderHeight,
    isSearchActive,
    setIsSearchActive,
    isMenuOpen,
    setIsMenuOpen,
  };

  return (
    <html
      lang="ru"
      className={`h-full ${fontHeading.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <StickyHeaderContext.Provider value={contextValue}>
        <body className="flex h-full min-h-screen flex-col">
          <ConditionalHeader />
          <SearchOverlay />
          {isHomePage && <DynamicHeroSection />}
          <main className="flex-grow">{children}</main>
          <Footer />
          <ClientInteractivity />
        </body>
      </StickyHeaderContext.Provider>
    </html>
  );
}
