'use client';

import { useRef } from 'react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { useHybridHeader } from '@/hooks/useHybridHeader'; // <-- Наш новый хук

export default function HybridHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const { translateY } = useHybridHeader(headerRef);

  // Пропсы для дочернего <Header />
  const { isSearchActive, setSearchActive, isMenuOpen, setMenuOpen } =
    useAppStore((state) => ({
      isSearchActive: state.isSearchActive,
      setSearchActive: state.setSearchActive,
      isMenuOpen: state.isMenuOpen,
      setMenuOpen: state.setMenuOpen,
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
        isMenuOpen={isMenuOpen}
        onMenuToggle={setMenuOpen}
        className="bg-white/80 backdrop-blur-md"
      />
    </div>
  );
}
