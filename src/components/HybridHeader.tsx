'use client';

import { useRef, useEffect } from 'react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { useHybridHeader } from './hooks/useHybridHeader';

export default function HybridHeader() {
  const headerRef = useRef<HTMLDivElement>(null);

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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Передаем состояние оверлея в хук ---
  const isOverlayOpen = isSearchActive || isFloatingMenuOpen;
  const { translateY, opacity, isSnapping } = useHybridHeader(
    headerRef,
    isOverlayOpen,
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);

    return () => {
      window.removeEventListener('resize', setHeaderHeightVar);
    };
  }, []);

  return (
    <div
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-[100] will-change-transform"
      style={{
        top: 'var(--site-mode-banner-offset, 0px)',
        transform: `translateY(${translateY}px)`,
        transition: isSnapping
          ? 'transform 220ms cubic-bezier(.2,.8,.2,1)'
          : 'transform 0s linear',
      }}
    >
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setSearchActive}
        isMenuOpen={isFloatingMenuOpen}
        onMenuToggle={setFloatingMenuOpen}
        className="bg-white"
        contentOpacity={opacity}
      />
    </div>
  );
}
