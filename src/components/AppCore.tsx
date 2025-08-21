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

const CustomCloseButton = () => (
  <button
    onClick={() => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
      }
    }}
    className="fixed top-4 right-4 z-[9999] h-8 w-8 rounded-full bg-black/10 text-black backdrop-blur-sm transition-colors hover:bg-black/20"
    aria-label="Закрыть"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="m-auto h-6 w-6"
    >
      <path
        fillRule="evenodd"
        d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  </button>
);

// --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем компонент SafeAreaTop, так как он больше не нужен ---
// const SafeAreaTop = () => ( ... );
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function AppCore({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [isTelegramApp, setIsTelegramApp] = useState(false);
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
    const tg = window?.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();

    (async () => {
      try {
        if (tg.requestFullscreen) {
          await tg.requestFullscreen();
        } else {
          tg.expand();
        }
      } catch {
        tg.expand();
      }
      tg.setHeaderColor('bg_color');
      tg.BackButton.hide();
      setIsTelegramApp(true);
    })();
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
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем SafeAreaTop --- */}
        {/* <SafeAreaTop /> */}
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        {isTelegramApp && <CustomCloseButton />}
        <NetworkStatusManager />
        <NotificationManager />
        <ConditionalHeader />
        <SearchOverlay />
        {isHomePage && <DynamicHeroSection />}

        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем класс safe-top --- */}
        <main className="flex-grow">{children}</main>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        <Footer />
        <ClientInteractivity />
      </FooterProvider>
    </StickyHeaderContext.Provider>
  );
}
