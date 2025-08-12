// Местоположение: src/components/SearchOverlay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useStickyHeader } from '@/context/StickyHeaderContext';

export default function SearchOverlay() {
  // Подключаемся к "каналу связи", чтобы слышать команды от "мозгового центра"
  const { isSearchActive, headerHeight } = useStickyHeader();

  // Используем наш стандартный паттерн для плавной анимации появления/исчезновения
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSearchActive) {
      // Команда "появиться": сначала монтируем, потом анимируем
      setIsMounted(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      // Команда "исчезнуть": сначала убираем анимацию, потом размонтируем
      setIsAnimating(false);
      const timer = setTimeout(() => setIsMounted(false), 300); // Длительность анимации
      return () => clearTimeout(timer);
    }
  }, [isSearchActive]); // Этот эффект зависит только от команды isSearchActive

  // Если компонент не смонтирован, он не рендерит ничего
  if (!isMounted) {
    return null;
  }

  const overlayClasses = [
    'fixed inset-0 bg-white z-30', // z-30, чтобы быть под шапкой (z-50) и над контентом
    'transition-opacity duration-300 ease-in-out',
    isAnimating ? 'opacity-100' : 'opacity-0', // Управляем прозрачностью
  ].join(' ');

  const overlayStyles: React.CSSProperties = {
    // "Ширма" начинается ровно под шапкой
    top: `${headerHeight}px`,
  };

  return (
    <div style={overlayStyles} className={overlayClasses}>
      {/* Здесь в будущем будут выводиться результаты поиска */}
    </div>
  );
}
