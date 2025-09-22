'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { FooterProvider } from '@/context/FooterContext';
import DynamicHeroSection from '@/components/DynamicHeroSection';
import ConditionalHeader from '@/components/ConditionalHeader';
import Footer from '@/components/Footer';
import ClientInteractivity from '@/components/ClientInteractivity';
import SearchOverlay from '@/components/SearchOverlay';
import NetworkStatusManager from '@/components/NetworkStatusManager';
import NotificationManager from '@/components/NotificationManager';
// Header больше не импортируется и не используется здесь

export default function AppCore({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const { data: session } = useSession();
  const { setUser, isSearchActive, isFloatingMenuOpen } = useAppStore(
    (state) => ({
      setUser: state.setUser,
      isSearchActive: state.isSearchActive,
      isFloatingMenuOpen: state.isFloatingMenuOpen,
    }),
  );

  useEffect(() => {
    setUser(session?.user ?? null);
  }, [session, setUser]);

  const scrollLockPosition = useRef(0);
  const isLockingScroll = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
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
    if (isSearchActive || isFloatingMenuOpen) {
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
  }, [isSearchActive, isFloatingMenuOpen]);

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <FooterProvider>
      <NetworkStatusManager />
      <NotificationManager />
      <ConditionalHeader />
      <SearchOverlay />
      <main className="flex-grow">
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью удаляем статический Header --- */}
        {/* Статичная версия шапки больше не нужна */}
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        {isHomePage && <DynamicHeroSection />}

        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем paddingTop, равный высоте хедера, ТОЛЬКО на главной --- */}
        <div
          className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12"
          style={
            isHomePage
              ? {
                  paddingTop: 'var(--header-height, 70px)',
                  paddingBottom: '3rem',
                } // 70px - запасное значение
              : { paddingBottom: '3rem' } // Для остальных страниц сохраняем только нижний отступ
          }
        >
          {children}
        </div>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </main>
      <Footer />
      <ClientInteractivity />
    </FooterProvider>
  );
}
