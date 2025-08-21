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

// Этот компонент теперь отвечает за всю клиентскую логику, которая раньше была в layout.
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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Внедряем "Пусковой механизм" для Web App ---
  useEffect(() => {
    // Этот код выполнится один раз, когда компонент "оживет" в браузере.
    // Мы проверяем, существует ли специальный объект Telegram Web App.
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // 1. Подаем команду на расширение до максимальной высоты.
      tg.expand();

      // 2. Даем понять Telegram, что наше приложение полностью загрузилось и готово к отображению.
      // Это убирает лишние задержки и делает опыт более "нативным".
      tg.ready();
    }
  }, []); // Пустой массив зависимостей гарантирует, что код выполнится только один раз.
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
      if (isSearchActive || isMenuOpen || !isHomePage) {
        return;
      }
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isScrollingDown) {
        if (currentScrollY > headerHeight) {
          setHeaderStatus('unpinned');
        }
        scrollUpAnchor.current = null;
        if (scrollDownAnchor.current === null) {
          scrollDownAnchor.current = currentScrollY;
        }
      } else {
        if (scrollUpAnchor.current === null) {
          scrollUpAnchor.current = currentScrollY;
        }
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
