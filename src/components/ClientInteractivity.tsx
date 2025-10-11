// Местоположение: src/components/ClientInteractivity.tsx
'use client';

import { useEffect, useRef } from 'react';
import FloatingMenuOverlay from './FloatingMenuOverlay';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { useAppStore } from '@/store/useAppStore'; // Импортируем "сейф"
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function ClientInteractivity() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Получаем состояние и функцию управления меню из глобального "сейфа"
  const { isMenuOpen, setMenuOpen } = useAppStore((state) => ({
    isMenuOpen: state.isFloatingMenuOpen,
    setMenuOpen: state.setFloatingMenuOpen,
  }));
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const scrollYRef = useRef(0);

  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    if (isMenuOpen) {
      scrollYRef.current = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      body.style.overflow = 'hidden';
      root.style.overflow = 'hidden';

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      body.style.overflow = '';
      body.style.paddingRight = '';
      root.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
    }

    return () => {
      body.style.overflow = '';
      body.style.paddingRight = '';
      root.style.overflow = '';
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

  return (
    <>
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
