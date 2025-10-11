// Местоположение: src/components/ClientInteractivity.tsx
'use client';

import { useEffect, useRef } from 'react';
import FloatingLogoButton from './FloatingLogoButton';
import FloatingMenuOverlay from './FloatingMenuOverlay';
import { useFooter } from '@/context/FooterContext';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { useAppStore } from '@/store/useAppStore'; // Импортируем "сейф"
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function ClientInteractivity() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Получаем состояние и функцию управления меню из глобального "сейфа"
  const { isMenuOpen, setMenuOpen, user } = useAppStore((state) => ({
    isMenuOpen: state.isFloatingMenuOpen,
    setMenuOpen: state.setFloatingMenuOpen,
    user: state.user,
  }));
  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name ?? null;
  const isAdminUser = roleName === 'ADMIN' || roleName === 'MANAGEMENT';
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const scrollYRef = useRef(0);
  const { footerHeight, isFooterVisible } = useFooter();

  useEffect(() => {
    if (isMenuOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollYRef.current}px`;
    } else {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const currentState = url.searchParams.get('menu');

    if (isMenuOpen && currentState !== 'open') {
      url.searchParams.set('menu', 'open');
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`,
      );
    }

    if (!isMenuOpen && currentState === 'open') {
      url.searchParams.delete('menu');
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get('menu') === 'open') {
      setMenuOpen(true);
    }
  }, [setMenuOpen]);

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Простая функция-переключатель
  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const BASE_CLOSE_BUTTON_OFFSET_PX = 96;
  const currentFooterHeight = isFooterVisible ? footerHeight : 0;
  const closeButtonBottomPosition =
    BASE_CLOSE_BUTTON_OFFSET_PX + currentFooterHeight;

  return (
    <>
      {isAdminUser && (
        <>
          <FloatingLogoButton onClick={toggleMenu} isMenuOpen={isMenuOpen} />

          {isMenuOpen && (
            <button
              onClick={toggleMenu}
              style={{ bottom: `${closeButtonBottomPosition}px` }}
              className="animate-in fade-in zoom-in-75 fixed right-[calc(7rem+env(safe-area-inset-right))] z-[110] flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#E6E7EE] bg-white/70 backdrop-blur-sm transition-[bottom] duration-300"
              aria-label="Закрыть меню"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </>
      )}

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
      {/* Передаем правильные пропсы */}
      <FloatingMenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
      />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </>
  );
}
