// Местоположение: src/components/AppCore.tsx
'use client';

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
import NotificationManager from '@/components/NotificationManager';

export default function AppCore({ children }: { children: React.ReactNode }) {
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
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем правильные, "узаконенные" команды ---
      tg.expand();

      // Используем кодовое имя 'bg_color', чтобы вернуть стандартную белую шапку
      tg.setHeaderColor('bg_color');

      // Показываем стандартную кнопку "Закрыть"
      tg.BackButton.show();

      // Обучаем ее, что делать при нажатии
      tg.BackButton.onClick(() => tg.close());

      tg.ready();
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    }
  }, []);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isSearchActive || isMenuOpen) {
      if (!isLockingScroll.current) {
        scrollLockPosition.current = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockPosition.current}px`;
        document.body.style.width = '100%';
        isLockingScroll.current = true;
      }
    } else {
      if (isLockingScroll.current) {
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollLockPosition.current);
        isLockingScroll.current = false;
      }
    }
  }, [isSearchActive, isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (isSearchActive || isMenuOpen || !isHomePage) return;
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isScrollingDown) {
        if (currentScrollY > headerHeight) setHeaderStatus('unpinned');
        scrollUpAnchor.current = null;
        if (scrollDownAnchor.current === null) {
          scrollDownAnchor.current = currentScrollY;
        }
      } else {
        if (scrollUpAnchor.current === null)
          scrollUpAnchor.current = currentScrollY;
        if (
          currentScrollY < scrollUpAnchor.current - SCROLL_UP_THRESHOLD &&
          currentScrollY > headerHeight
        ) {
          setHeaderStatus('pinned');
        } else if (currentScrollY <= headerHeight) {
          setHeaderStatus('static');
        }
        scrollDownAnchor.current = null;
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
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
    <StickyHeaderContext.Provider value={contextValue}>
      <FooterProvider>
        <NetworkStatusManager />
        <NotificationManager />
        <ConditionalHeader />
        <SearchOverlay />
        {isHomePage && <DynamicHeroSection />}
        <main className="flex-grow">{children}</main>
        <Footer />
        <ClientInteractivity />
      </FooterProvider>
    </StickyHeaderContext.Provider>
  );
}
