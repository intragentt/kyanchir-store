// Местоположение: src/components/CategoryFilter.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- ИЗМЕНЕНИЕ: Обновляем список категорий ---
const categories = [
  { id: 'all', name: 'все товары' },
  { id: 'pijamas', name: 'пижамы' },
  { id: 'underwear', name: 'нижнее белье' },
  { id: 'for-home', name: 'для дома' },
  { id: 'certificates', name: 'сертификаты' },
];

interface CategoryFilterProps {
  onSelectCategory: (categoryId: string) => void;
  activeCategory: string;
}

export default function CategoryFilter({
  onSelectCategory,
  activeCategory,
}: CategoryFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState({ left: 0, width: 0 });
  const isFirstRender = useRef(true);

  // Логика обновления подчеркивающей линии
  const updateLinePosition = useCallback(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector(
        `[data-category-id="${activeCategory}"]`,
      ) as HTMLElement;
      if (activeElement) {
        setLineStyle({
          left: activeElement.offsetLeft,
          width: activeElement.offsetWidth,
        });
      }
    }
  }, [activeCategory]);

  useEffect(() => {
    const timeout = setTimeout(updateLinePosition, 50);
    window.addEventListener('resize', updateLinePosition);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateLinePosition);
    };
  }, [activeCategory, updateLinePosition]);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    onSelectCategory(categoryId);
    // Сохраняем выбор в localStorage (опционально)
    localStorage.setItem('activeCategory', categoryId);
  };

  // Автоскролл активной кнопки при любом изменении activeCategory
  useEffect(() => {
    if (containerRef.current) {
      const btn = containerRef.current.querySelector(
        `[data-category-id="${activeCategory}"]`,
      );
      if (btn && btn.scrollIntoView) {
        btn.scrollIntoView({
          behavior: isFirstRender.current ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
    isFirstRender.current = false;
  }, [activeCategory]);

  return (
    <div
      className="relative flex min-h-[56px] w-full max-w-none items-center border-none bg-white"
      style={{ boxShadow: 'none', borderBottom: 'none' }}
    >
      <div className="relative w-full">
        <div
          ref={containerRef}
          className="kyanchir-lg:justify-center -mx-4 flex items-center justify-start overflow-x-auto sm:-mx-6 lg:-mx-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex flex-none items-center pr-4 pl-2 sm:pr-6 sm:pl-4 lg:pr-8 lg:pl-6">
            {categories.map((category) => (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`font-body flex-none px-3 text-base font-semibold whitespace-nowrap transition-colors duration-200 ease-in-out focus:outline-none md:text-lg ${
                  activeCategory === category.id
                    ? 'text-brand-lilac'
                    : 'hover:text-text-primary text-gray-500'
                }`}
              >
                <span className="flex h-full flex-col items-center justify-center">
                  <span>{category.name}</span>
                  {activeCategory === category.id && (
                    <span
                      className="mt-1 block"
                      style={{
                        background: '#272727',
                        height: '1.5px',
                        width: '100%',
                      }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
        {/* Градиенты по краям скролла */}
        <div className="pointer-events-none absolute top-0 right-[-1rem] z-10 h-full w-6 bg-gradient-to-l from-white/90 to-transparent sm:right-[-1.5rem] lg:right-[-2rem]" />
        <div className="pointer-events-none absolute top-0 left-[-1rem] z-10 h-full w-6 bg-gradient-to-r from-white to-transparent sm:left-[-1.5rem] lg:left-[-2rem]" />
      </div>
    </div>
  );
}
