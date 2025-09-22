'use client';

import { useRef, useEffect } from 'react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { useHybridHeader } from './hooks/useHybridHeader';

export default function HybridHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const { translateY, opacity } = useHybridHeader(headerRef);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Измеряем высоту хедера и устанавливаем CSS-переменную ---
  useEffect(() => {
    const setHeaderHeightVar = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          '--header-height',
          `${height}px`,
        );
      }
    };

    // Устанавливаем при монтировании и при изменении размера окна
    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);

    return () => {
      window.removeEventListener('resize', setHeaderHeightVar);
    };
  }, []);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Убираем тень (shadow-md) --- */}
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setSearchActive}
        isMenuOpen={isFloatingMenuOpen}
        onMenuToggle={setFloatingMenuOpen}
        className="bg-white"
        contentOpacity={opacity}
      />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
