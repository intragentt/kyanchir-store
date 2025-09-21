'use client';

import { useRef } from 'react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { useHybridHeader } from './hooks/useHybridHeader';

export default function HybridHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  // --- ИЗМЕНЕНИЕ: Получаем opacity из хука ---
  const { translateY, opacity } = useHybridHeader(headerRef);

  const { isSearchActive, setSearchActive, isFloatingMenuOpen, setFloatingMenuOpen } =
    useAppStore((state) => ({
      isSearchActive: state.isSearchActive,
      setSearchActive: state.setSearchActive,
      isFloatingMenuOpen: state.isFloatingMenuOpen,
      setFloatingMenuOpen: state.setFloatingMenuOpen,
    }));

  return (
    <div
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-[100] will-change-transform"
      style={{
        transform: `translateY(${translateY}px)`,
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setSearchActive}
        isMenuOpen={isFloatingMenuOpen}
        onMenuToggle={setFloatingMenuOpen}
        className="bg-white shadow-md"
        // --- ИЗМЕНЕНИЕ: Передаем прозрачность как новый проп ---
        contentOpacity={opacity}
      />
    </div>
  );
}