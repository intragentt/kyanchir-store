// Местоположение: src/components/layout/StickyCategoryFilter.tsx
'use client';

import CategoryFilter from '@/components/CategoryFilter';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем "должностную инструкцию" (Props) ---
// Добавляем все недостающие "пункты", чтобы соответствовать CatalogHeaderController.
interface Category {
  id: string;
  name: string;
}

interface StickyCategoryFilterProps {
  isVisible: boolean;
  topPosition: number;
  onSelectCategory: (categoryId: string) => void;
  activeCategory: string;
  categories: Category[];
  scrollLeft: number;
  onScroll: (scrollLeft: number) => void;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function StickyCategoryFilter({
  isVisible,
  topPosition,
  onSelectCategory,
  activeCategory,
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Принимаем новые "инструменты" ---
  categories,
  scrollLeft,
  onScroll,
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}: StickyCategoryFilterProps) {
  const wrapperClasses = [
    'fixed w-full z-[151]',
    'will-change-transform',
    'transition-transform duration-300 ease-in-out',
    isVisible ? 'transform-none' : '-translate-y-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapperClasses}
      style={{ top: `${topPosition}px` }}
      aria-hidden={!isVisible}
    >
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Передаем все "инструменты" дальше, в сам фильтр --- */}
      <CategoryFilter
        onSelectCategory={onSelectCategory}
        activeCategory={activeCategory}
        categories={categories}
        scrollLeft={scrollLeft}
        onScroll={onScroll}
      />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
