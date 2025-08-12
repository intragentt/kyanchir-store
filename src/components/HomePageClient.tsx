// Местоположение: src/components/HomePageClient.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import CatalogContent from '@/components/CatalogContent';
import SmartStickyCategoryFilter from '@/components/SmartStickyCategoryFilter';
import { ProductWithInfo } from '@/lib/types';

interface HomePageClientProps {
  initialProducts: ProductWithInfo[];
}

export default function HomePageClient({
  initialProducts,
}: HomePageClientProps) {
  const [allProducts] = useState<ProductWithInfo[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] =
    useState<ProductWithInfo[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filterContainerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let productsToFilter = [...allProducts];
    if (searchTerm.trim() !== '') {
      productsToFilter = productsToFilter.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (activeCategory !== 'all') {
      const shuffled = [...productsToFilter].sort(() => 0.5 - Math.random());
      productsToFilter = shuffled.slice(0, 5);
    }
    setFilteredProducts(productsToFilter);
  }, [searchTerm, activeCategory, allProducts]);

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (activeCategory === categoryId) return;

      if (filterContainerRef.current) {
        const destination = filterContainerRef.current.offsetTop;
        window.scrollTo({
          top: destination,
          behavior: 'smooth',
        });
      }

      setActiveCategory(categoryId);
    },
    [activeCategory],
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <div ref={filterContainerRef}>
        <SmartStickyCategoryFilter
          onSelectCategory={handleSelectCategory}
          initialCategory={activeCategory}
          className="mb-4"
          workZoneRef={productGridRef}
          // --- ИЗМЕНЕНИЕ: Убираем ненужный пропс headerHeight ---
          // Фильтр теперь получает всю информацию о шапке автоматически
        />
      </div>

      <div className="mb-6 pl-2 text-base font-medium text-gray-900">
        двойки
      </div>

      <div ref={productGridRef} className="relative min-h-[200vh]">
        <CatalogContent products={filteredProducts} isLoading={false} />
      </div>
    </div>
  );
}
