// Местоположение: src/components/HomePageClient.tsx
// Метафора: "Терпеливый Дирижер Анимаций".
// Компонент научился управлять очередностью анимаций, чтобы избежать
// конфликтов. Он сначала запускает одну, ждет ее завершения,
// и только потом дает команду на запуск второй.

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import CatalogContent from '@/components/CatalogContent';
import SmartStickyCategoryFilter from '@/components/SmartStickyCategoryFilter';
import { ProductWithInfo } from '@/lib/types';

type Category = {
  id: string;
  name: string;
};

interface HomePageClientProps {
  initialProducts: ProductWithInfo[];
  categories: Category[];
}

export default function HomePageClient({
  initialProducts,
  categories,
}: HomePageClientProps) {
  const [allProducts] = useState<ProductWithInfo[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] =
    useState<ProductWithInfo[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filterContainerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);

  // Ref для отслеживания процесса скролла.
  const scrollingToFilter = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // --- ОБНОВЛЕНО: "Терпеливый" обработчик выбора категории ---
  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      if (activeCategory === categoryId || scrollingToFilter.current) return;

      if (filterContainerRef.current) {
        // Шаг 1: Запускаем скролл страницы.
        const destination = filterContainerRef.current.offsetTop;
        scrollingToFilter.current = true; // Поднимаем флаг "скроллимся".
        window.scrollTo({
          top: destination,
          behavior: 'smooth',
        });

        // Шаг 2: Создаем "слушателя", который будет следить за окончанием скролла.
        const scrollEndListener = () => {
          // Если скролл остановился (больше не меняется), считаем его завершенным.
          if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
          scrollTimeout.current = setTimeout(() => {
            window.removeEventListener('scroll', scrollEndListener);
            scrollingToFilter.current = false; // Опускаем флаг.
            // Шаг 3: Только теперь, когда скролл страницы завершен,
            // мы обновляем категорию, что запустит вторую анимацию (центрирование).
            setActiveCategory(categoryId);
          }, 100); // 100ms - таймаут для определения "остановки" скролла.
        };

        window.addEventListener('scroll', scrollEndListener);
      } else {
        // Если что-то пошло не так, просто меняем категорию.
        setActiveCategory(categoryId);
      }
    },
    [activeCategory],
  );

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <div ref={filterContainerRef}>
        <SmartStickyCategoryFilter
          onSelectCategory={handleSelectCategory}
          initialCategory={activeCategory}
          className="mb-4"
          workZoneRef={productGridRef}
          categories={categories}
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
