// Местоположение: src/components/layout/StickyCategoryFilter.tsx
'use client';

import CategoryFilter from '../CategoryFilter'; // Наш оригинальный компонент

// Определяем типы для пропсов, которые будут управлять этим компонентом
interface StickyCategoryFilterProps {
  isVisible: boolean;
  topPosition: number; // Это ключ к нашему "аккордеону"!
  onSelectCategory: (categoryId: string) => void;
  activeCategory: string;
}

export default function StickyCategoryFilter({
  isVisible,
  topPosition,
  onSelectCategory,
  activeCategory,
}: StickyCategoryFilterProps) {
  // Генерируем классы для плавной анимации, как у шапки
  const wrapperClasses = [
    'fixed w-full z-[151]', // z-index важен, чтобы быть НАД шапкой, но под мобильным меню
    'will-change-transform', // Подсказка для Safari
    'transition-transform duration-300 ease-in-out',
    isVisible ? 'transform-none' : '-translate-y-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // Этот div будет "липким"
    <div
      className={wrapperClasses}
      // Динамически устанавливаем позицию от верха экрана.
      // Если шапка видна, top будет 65px. Если нет - 0px.
      style={{ top: `${topPosition}px` }}
      aria-hidden={!isVisible}
    >
      <CategoryFilter
        onSelectCategory={onSelectCategory}
        activeCategory={activeCategory}
      />
    </div>
  );
}
