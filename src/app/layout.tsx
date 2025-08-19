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

import { FooterProvider } from '@/context/FooterContext';

import DynamicHeroSection from '@/components/DynamicHeroSection';
import ConditionalHeader from '@/components/ConditionalHeader';
import Footer from '@/components/Footer';
import ClientInteractivity from '@/components/ClientInteractivity';
import SearchOverlay from '@/components/SearchOverlay';
import NetworkStatusManager from '@/components/NetworkStatusManager';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем наш новый универсальный менеджер ---
import NotificationManager from '@/components/NotificationManager';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [headerStatus, setHeaderStatus] = useState<HeaderStatus>('static');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const lastScrollY = useRef(0);
  const scrollLockPosition = useRef(0);
  const isLockingScroll = useRef(false);

  const SCROLL_UP_THRESHOLD = 800;
  const SCROLL_DOWN_THRESHOLD = 50;
  const scrollUpAnchor = useRef<number | null>(null);
  const scrollDownAnchor = useRef<number | null>(null);

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
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <StickyHeaderContext.Provider value={contextValue}>
        <body className="flex h-full min-h-screen flex-col">
          <FooterProvider>
            <NetworkStatusManager />
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Размещаем здесь наш новый компонент --- */}
            <NotificationManager />
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
            <ConditionalHeader />
            <SearchOverlay />
            {isHomePage && <DynamicHeroSection />}
            <main className="flex-grow">{children}</main>
            <Footer />
            <ClientInteractivity />
          </FooterProvider>
        </body>
      </StickyHeaderContext.Provider>
    </html>
  );
}
