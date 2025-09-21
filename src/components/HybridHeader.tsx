'use client';

import { useRef } from 'react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
// --- ИЗМЕНЕНИЕ: Исправляем путь импорта на относительный ---
import { useHybridHeader } from './hooks/useHybridHeader';

export default function HybridHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const { translateY } = useHybridHeader(headerRef);

  // --- ИЗМЕНЕНИЕ: Получаем все состояние из Zustand, используем правильные имена ---
  const {
    isSearchActive,
    setSearchActive,
    isFloatingMenuOpen,
    setFloatingMenuOpen,
  } = useAppStore((state) => ({
    isSearchActive: state.isSearchActive,
    setSearchActive: state.setSearchActive,
    isFloatingMenuOpen: state.isFloatingMenuOpen,
    setFloatingMenuOpen: state.setFloatingMenuOpen,
  }));

  return (
    <div
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-[100] will-change-transform"
      style={{
        transform: `translateY(${translateY}px)`,
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setSearchActive}
        isMenuOpen={isFloatingMenuOpen} // <-- Используем isFloatingMenuOpen
        onMenuToggle={setFloatingMenuOpen} // <-- Используем setFloatingMenuOpen
        className="bg-white/80 backdrop-blur-md"
      />
    </div>
  );
}
