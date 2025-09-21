'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
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

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const { data: session } = useSession();
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    setUser(session?.user ?? null);
  }, [session, setUser]);

  const [headerStatus, setHeaderStatus] = useState<HeaderStatus>('static');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const scrollLockPosition = useRef(0);
  const isLockingScroll = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      setHeaderStatus('static');
      lastScrollY.current = 0;
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.setHeaderColor('bg_color');
      tg.BackButton.show();
      tg.BackButton.onClick(() => tg.close());
      tg.ready();
    }
  }, []);

  useEffect(() => {
    const preventGesture = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);
    document.addEventListener('gestureend', preventGesture);
    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью новая, "инстаграмная" логика скролла ---
  useEffect(() => {
    const handleScroll = () => {
      if (isSearchActive || isMenuOpen || !isHomePage) return;
      const currentScrollY = window.scrollY;

      // Если мы у самого верха, шапка всегда статична
      if (currentScrollY <= headerHeight) {
        setHeaderStatus('static');
        lastScrollY.current = currentScrollY;
        return;
      }

      // Если скроллим вниз, прячем шапку
      if (currentScrollY > lastScrollY.current) {
        setHeaderStatus('unpinned');
      } else {
        // Если скроллим вверх, показываем шапку
        setHeaderStatus('pinned');
      }

      // Обновляем позицию для следующего события скролла
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, headerHeight, isSearchActive, isMenuOpen]);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const contextValue = {
    headerStatus,
    headerHeight,
    setHeaderHeight,
    isSearchActive,
    setIsSearchActive,
    isMenuOpen,
    setIsMenuOpen,
  };

  if (isAuthPage) {
    return <main>{children}</main>;
  }

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
