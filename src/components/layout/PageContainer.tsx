// Местоположение: src/components/layout/PageContainer.tsx
import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Основной контейнер для страниц, который в точности повторяет сетку из Header.
 * Использует класс `container` и отзывчивые отступы для идеального выравнивания.
 */
export default function PageContainer({
  children,
  className = '',
}: PageContainerProps) {
  return (
    // VVV--- ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ ---VVV
    // Мы заменяем max-w-7xl на связку container и точных отступов из твоего хедера.
    <div
      className={`container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 ${className}`}
    >
      {children}
    </div>
  );
}
