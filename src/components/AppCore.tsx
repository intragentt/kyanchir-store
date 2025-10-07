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
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем новый компонент ---
import CookieConsentBanner from './CookieConsentBanner';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function AppCore({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isProfilePage = pathname === '/profile';
  const isProductPage =
    pathname.startsWith('/p/') || pathname.startsWith('/product/');

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
    const html = document.documentElement;
    const body = document.body;
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    if (isSearchActive || isFloatingMenuOpen) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
    }
    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
    };
  }, [isSearchActive, isFloatingMenuOpen]);

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  const mainStyle =
    isHomePage || isProfilePage || isProductPage
      ? { paddingTop: 'var(--header-height, 70px)' }
      : {};

  const contentClassName = isProductPage
    ? 'mx-auto w-full px-0 pb-16 pt-4 sm:px-4 lg:px-10 xl:px-16'
    : 'sm-px-6 container mx-auto px-4 py-12 lg:px-8 xl:px-12';

  return (
    <FooterProvider>
      <NetworkStatusManager />
      <NotificationManager />
      <ConditionalHeader />
      <SearchOverlay />
      <main className="flex-grow" style={mainStyle}>
        {isHomePage && <DynamicHeroSection />}
        <div className={contentClassName}>
          {children}
        </div>
      </main>
      <Footer />
      <ClientInteractivity />
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем баннер в самый конец --- */}
      <CookieConsentBanner />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </FooterProvider>
  );
}
