// Местоположение: src/components/CategoryFilter.tsx
// ФИНАЛЬНАЯ ВЕРСИЯ

'use client';

import React, { useRef, useEffect } from 'react';

type Category = {
  id: string;
  name: string;
};

interface CategoryFilterProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  activeCategory: string;
  scrollLeft: number;
  onScroll: (scrollOffset: number) => void;
  disableCentering?: boolean;
}

export default function CategoryFilter({
  categories,
  onSelectCategory,
  activeCategory,
  scrollLeft,
  onScroll,
  disableCentering = false,
}: CategoryFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Механизм "Слушаться": просто и надежно.
  useEffect(() => {
    if (
      containerRef.current &&
      containerRef.current.scrollLeft !== scrollLeft
    ) {
      containerRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  // "Умный камерамэн" с "выключателем".
  useEffect(() => {
    if (!disableCentering && containerRef.current) {
      const btn = containerRef.current.querySelector(
        `[data-category-id="${activeCategory}"]`,
      );
      if (btn) {
        btn.scrollIntoView({
          behavior: isFirstRender.current ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
    isFirstRender.current = false;
  }, [activeCategory, disableCentering]);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    onSelectCategory(categoryId);
    localStorage.setItem('activeCategory', categoryId);
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    onScroll(event.currentTarget.scrollLeft);
  };

  return (
    <div
      className="relative flex min-h-[56px] w-full max-w-none items-center border-none bg-white"
      style={{ boxShadow: 'none', borderBottom: 'none' }}
    >
      <div className="relative w-full">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="-mx-4 flex items-center justify-start overflow-x-auto sm:-mx-6 lg:-mx-8 xl:-mx-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex flex-none items-center pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pr-8 lg:pl-8 xl:pr-12 xl:pl-12">
            {categories.map((category) => (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`font-body flex-none px-3 text-base font-semibold whitespace-nowrap transition-colors duration-200 ease-in-out focus:outline-none md:text-lg ${
                  activeCategory === category.id
                    ? 'text-text-primary'
                    : 'hover:text-text-primary text-gray-600'
                }`}
                aria-pressed={activeCategory === category.id}
              >
                <span className="flex h-full flex-col items-center justify-center">
                  <span>{category.name}</span>
                  {activeCategory === category.id && (
                    <span
                      className="mt-1 block"
                      style={{
                        backgroundColor: 'currentColor',
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
        <div className="pointer-events-none absolute top-0 right-[-1rem] z-10 h-full w-6 bg-gradient-to-l from-white/90 to-transparent sm:right-[-1.5rem] lg:right-[-2rem] xl:right-[-3rem]" />
        <div className="pointer-events-none absolute top-0 left-[-1rem] z-10 h-full w-6 bg-gradient-to-r from-white to-transparent sm:left-[-1.5rem] lg:left-[-2rem] xl:left-[-3rem]" />
      </div>
    </div>
  );
}
