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

  // Этот useEffect сбрасывает скролл только при переходе на новую страницу
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Интеграция с Telegram Web App
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

  // Предотвращение жестов масштабирования на iOS
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

  // Новая, правильная логика блокировки скролла через overflow
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Сохраняем исходные стили, чтобы вернуть их позже
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;

    if (isSearchActive || isFloatingMenuOpen) {
      // Применяем блокировку скролла
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      // Возвращаем исходные стили
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
    }

    // Функция очистки, которая сработает при размонтировании компонента
    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
    };
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
      <main
        className="flex-grow"
        style={
          isHomePage
            ? { paddingTop: 'var(--header-height, 70px)' } // 70px - запасное значение на случай, если JS не успел
            : {}
        }
      >
        {isHomePage && <DynamicHeroSection />}
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 xl:px-12">
          {children}
        </div>
      </main>
      <Footer />
      <ClientInteractivity />
    </FooterProvider>
  );
}
