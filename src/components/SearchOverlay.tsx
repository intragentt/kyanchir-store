// Местоположение: src/components/SearchOverlay.tsx
'use client';

import React, { useState, useEffect } from 'react';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Заменяем мертвый контекст на Zustand ---
import { useAppStore } from '@/store/useAppStore';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function SearchOverlay() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Получаем состояние напрямую из хранилища ---
  const isSearchActive = useAppStore((state) => state.isSearchActive);
  // Временно используем константу для высоты шапки
  const headerHeight = 64;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSearchActive) {
      setIsMounted(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSearchActive]);

  if (!isMounted) {
    return null;
  }

  const overlayClasses = [
    'fixed inset-0 bg-white z-30',
    'transition-opacity duration-300 ease-in-out',
    isAnimating ? 'opacity-100' : 'opacity-0',
  ].join(' ');

  const overlayStyles: React.CSSProperties = {
    top: `${headerHeight}px`,
  };

  return (
    <div style={overlayStyles} className={overlayClasses}>
      {/* Здесь в будущем будут выводиться результаты поиска */}
    </div>
  );
}
