'use client';

import { useRef } from 'react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { useHybridHeader } from './hooks/useHybridHeader';

export default function HybridHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const { translateY } = useHybridHeader(headerRef);

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
        // Используем transition из CSS для плавной анимации "примагничивания"
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Делаем шапку непрозрачной и добавляем тень --- */}
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setSearchActive}
        isMenuOpen={isFloatingMenuOpen}
        onMenuToggle={setFloatingMenuOpen}
        className="bg-white shadow-md"
      />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
