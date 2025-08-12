// Местоположение: src/components/CatalogContent.tsx
'use client';

import React from 'react';
import ProductCard from '@/components/ProductCard';
// --- ИЗМЕНЕНИЕ: Указываем правильный путь к нашему центральному файлу типов ---
import { ProductWithInfo } from '@/lib/types';

// Компонент теперь очень простой и "глупый"
interface CatalogContentProps {
  products: ProductWithInfo[];
  isLoading: boolean;
}

export default function CatalogContent({
  products,
  isLoading,
}: CatalogContentProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-x-4 gap-y-10 transition-opacity duration-300 sm:gap-x-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 xl:max-w-7xl xl:grid-cols-4 xl:gap-x-10 2xl:mx-auto 2xl:max-w-[1600px] ${isLoading ? 'opacity-0' : 'opacity-100'}`}
    >
      {products.map((product) =>
        product && product.id ? (
          <ProductCard key={product.id} product={product} />
        ) : null,
      )}
    </div>
  );
}
