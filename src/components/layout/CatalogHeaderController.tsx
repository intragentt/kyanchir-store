// Местоположение: src/components/layout/CatalogHeaderController.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@prisma/client';

// Компоненты
import Header from '@/components/Header';
import StickyHeader from './StickyHeader';
import CategoryFilter from '../CategoryFilter';
import StickyCategoryFilter from './StickyCategoryFilter';
import CatalogContent from '../CatalogContent';
import { useStickyHeader } from '@/context/StickyHeaderContext';

// Типы
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
};

// --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем тип для категорий ---
interface Category {
  id: string;
  name: string;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const HEADER_HEIGHT = 65;

// --- НАЧАЛО ИЗМЕНЕНИЙ: Компонент теперь должен ПРИНИМАТЬ категории ---
interface CatalogHeaderControllerProps {
  categories: Category[];
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function CatalogHeaderController({
  categories,
}: CatalogHeaderControllerProps) {
  const [allProducts, setAllProducts] = useState<ProductWithInfo[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithInfo[]>(
    [],
  );
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем состояние для синхронизации скролла ---
  const [scrollLeft, setScrollLeft] = useState(0);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const [isStickyHeaderVisible, setIsStickyHeaderVisible] = useState(false);
  const [isStickyFilterVisible, setIsStickyFilterVisible] = useState(false);
  const [filterTopPosition, setFilterTopPosition] = useState(0);

  const originalHeaderRef = useRef<HTMLDivElement>(null);
  const originalFilterRef = useRef<HTMLDivElement>(null);
  const workZoneRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const { isSearchActive, setIsSearchActive, isMenuOpen, setIsMenuOpen } =
    useStickyHeader();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем обработчик скролла ---
  const handleFilterScroll = useCallback((newScrollLeft: number) => {
    setScrollLeft(newScrollLeft);
  }, []);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const applyFilter = useCallback(
    (products: ProductWithInfo[], categoryId: string) => {
      // Логика фильтрации остается вашей
      if (categoryId === 'all') {
        setFilteredProducts(products);
      } else {
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        setFilteredProducts(shuffled.slice(0, 5));
      }
    },
    [],
  );

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (activeCategory === categoryId) return;
      setIsLoading(true);
      setActiveCategory(categoryId);
      setTimeout(() => {
        applyFilter(allProducts, categoryId);
        setIsLoading(false);
      }, 300);
    },
    [activeCategory, allProducts, applyFilter],
  );

  useEffect(() => {
    const headerEl = originalHeaderRef.current;
    const filterEl = originalFilterRef.current;
    if (!headerEl || !filterEl) return;
    const filterOriginalTop = filterEl.offsetTop;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isScrollingUp = scrollY < lastScrollY.current;
      const isScrollingDown = scrollY > lastScrollY.current;

      if (scrollY > HEADER_HEIGHT) {
        if (isScrollingUp) setIsStickyHeaderVisible(true);
        else if (isScrollingDown) setIsStickyHeaderVisible(false);
      } else {
        setIsStickyHeaderVisible(false);
      }

      const filterActivationPoint = filterOriginalTop - HEADER_HEIGHT;
      if (scrollY > filterActivationPoint) {
        if (isScrollingUp) setIsStickyFilterVisible(true);
        else if (isScrollingDown) setIsStickyFilterVisible(false);
      } else {
        setIsStickyFilterVisible(false);
      }

      if (isStickyHeaderVisible) {
        setFilterTopPosition(HEADER_HEIGHT);
      } else {
        setFilterTopPosition(0);
      }

      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isStickyHeaderVisible]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <StickyHeader
        isVisible={isStickyHeaderVisible}
        isTransitionEnabled={true}
      />
      <StickyCategoryFilter
        isVisible={isStickyFilterVisible}
        topPosition={filterTopPosition}
        onSelectCategory={handleSelectCategory}
        activeCategory={activeCategory}
        // --- НАЧАЛО ИЗМЕНЕНИЙ: Передаем недостающие пропсы "клону" ---
        categories={categories}
        scrollLeft={scrollLeft}
        onScroll={handleFilterScroll}
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      />

      <div ref={originalHeaderRef}>
        <Header
          isSearchActive={isSearchActive}
          onSearchToggle={setIsSearchActive}
          isMenuOpen={isMenuOpen}
          onMenuToggle={setIsMenuOpen}
        />
      </div>
      <div ref={originalFilterRef}>
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Передаем недостающие пропсы "оригиналу" --- */}
        <CategoryFilter
          onSelectCategory={handleSelectCategory}
          activeCategory={activeCategory}
          categories={categories}
          scrollLeft={scrollLeft}
          onScroll={handleFilterScroll}
        />
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </div>

      <div ref={workZoneRef}>
        <CatalogContent products={filteredProducts} isLoading={isLoading} />
      </div>
    </div>
  );
}
