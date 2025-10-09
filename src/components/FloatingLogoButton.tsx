// Местоположение: src/components/FloatingLogoButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShortLogo } from './shared/icons';
import { useFooter } from '@/context/FooterContext';

interface FloatingLogoButtonProps {
  onClick: () => void;
  isMenuOpen: boolean;
}

export default function FloatingLogoButton({
  onClick,
  isMenuOpen,
}: FloatingLogoButtonProps) {
  const [opacity, setOpacity] = useState(0.15);
  const { footerHeight, isFooterVisible } = useFooter();

  // Логика прозрачности (без изменений)
  useEffect(() => {
    if (isMenuOpen) {
      setOpacity(1);
      return;
    }
    const GHOST_OPACITY = 0.15;
    const MIN_OPACITY = 0.5;
    const MAX_OPACITY = 1;
    const ACTIVATION_THRESHOLD = 50;
    const TRANSITION_DISTANCE = 200;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < ACTIVATION_THRESHOLD) {
        setOpacity(GHOST_OPACITY);
      } else {
        const scrollProgress = Math.min(
          (scrollY - ACTIVATION_THRESHOLD) / TRANSITION_DISTANCE,
          1,
        );
        const newOpacity =
          MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * scrollProgress;
        setOpacity(newOpacity);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Значительно увеличиваем базовый отступ ---
  const BASE_BOTTOM_OFFSET = 120; // Было 44, стало 80
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  const currentFooterHeight = isFooterVisible ? footerHeight : 0;

  const menuButtonLabel = isMenuOpen
    ? 'Скрыть плавающее меню'
    : 'Открыть плавающее меню';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        opacity: opacity,
        bottom: `${BASE_BOTTOM_OFFSET + currentFooterHeight}px`,
        transition: 'opacity 300ms ease-in-out, bottom 300ms ease-in-out',
      }}
      className={`fixed right-6 ${isMenuOpen ? 'z-[110]' : 'z-50'} flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#E6E7EE] bg-white/70 backdrop-blur-sm`}
      aria-label={menuButtonLabel}
      aria-expanded={isMenuOpen}
      aria-controls="floating-menu-overlay"
      title={menuButtonLabel}
    >
      {isMenuOpen ? (
        <ShortLogo aria-hidden className="h-8 w-auto text-[#6B80C5]" />
      ) : (
        <ShortLogo aria-hidden className="h-8 w-auto text-[#E6E7EE]" />
      )}
    </button>
  );
}

FloatingLogoButton.displayName = 'FloatingLogoButton';
