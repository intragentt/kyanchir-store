// Местоположение: src/components/layout/CatalogHeaderController.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import StickyHeader from './StickyHeader';
import CategoryFilter from '../CategoryFilter';
import StickyCategoryFilter from './StickyCategoryFilter';
import CatalogContent from '../CatalogContent';
import { useAppStore } from '@/store/useAppStore';
import { ProductWithInfo } from '@/lib/types';

interface Category {
  id: string;
  name: string;
}

const HEADER_HEIGHT = 65;

interface CatalogHeaderControllerProps {
  categories: Category[];
}

export default function CatalogHeaderController({
  categories,
}: CatalogHeaderControllerProps) {
  const [allProducts, setAllProducts] = useState<ProductWithInfo[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithInfo[]>(
    [],
  );
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [isStickyHeaderVisible, setIsStickyHeaderVisible] = useState(false);
  const [isStickyFilterVisible, setIsStickyFilterVisible] = useState(false);
  const [filterTopPosition, setFilterTopPosition] = useState(0);

  const originalHeaderRef = useRef<HTMLDivElement>(null);
  const originalFilterRef = useRef<HTMLDivElement>(null);
  const workZoneRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleFilterScroll = useCallback((newScrollLeft: number) => {
    setScrollLeft(newScrollLeft);
  }, []);

  const applyFilter = useCallback(
    (products: ProductWithInfo[], categoryId: string) => {
      if (categoryId === 'all') {
        setFilteredProducts(products);
      } else {
        // ИСПРАВЛЕНО: фильтрация по categoryIds вместо случайной выборки
        const filtered = products.filter((product) =>
          product.categoryIds.includes(categoryId),
        );
        setFilteredProducts(filtered);
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
        categories={categories}
        scrollLeft={scrollLeft}
        onScroll={handleFilterScroll}
      />

      <div ref={originalHeaderRef}>
        <Header
          isSearchActive={isSearchActive}
          onSearchToggle={setSearchActive}
          isMenuOpen={isFloatingMenuOpen}
          onMenuToggle={setFloatingMenuOpen}
        />
      </div>
      <div ref={originalFilterRef}>
        <CategoryFilter
          onSelectCategory={handleSelectCategory}
          activeCategory={activeCategory}
          categories={categories}
          scrollLeft={scrollLeft}
          onScroll={handleFilterScroll}
        />
      </div>

      <div ref={workZoneRef}>
        <CatalogContent products={filteredProducts} isLoading={isLoading} />
      </div>
    </div>
  );
}
