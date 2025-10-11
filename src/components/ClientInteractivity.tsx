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
