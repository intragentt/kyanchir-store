'use client';

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  /**
   * 🔢 Количество строк скелетона
   */
  rows?: number;
  /**
   * 🔢 Количество "ячеек" в каждой строке
   */
  columns?: number;
  /**
   * 🎨 Дополнительные классы Tailwind
   */
  className?: string;
  /**
   * ⚙️ Тип визуализации
   */
  variant?: 'table' | 'card' | 'text';
  /**
   * ✨ Управление анимацией
   */
  animated?: boolean;
}

/**
 * 🦴 УНИВЕРСАЛЬНЫЙ SKELETON LOADER
 *
 * Показывает анимированный каркас, пока данные ещё загружаются.
 * Компонент используется в таблицах, карточках и текстовых блоках.
 */
const SkeletonLoader = memo(function SkeletonLoader({
  rows = 4,
  columns = 3,
  className,
  variant = 'table',
  animated = true,
}: SkeletonLoaderProps) {
  console.log('🔄 SkeletonLoader: рендер компонента', {
    rows,
    columns,
    variant,
    animated,
  });

  const placeholders = useMemo(() => {
    return Array.from({ length: rows }, (_, rowIndex) => (
      <div
        key={`skeleton-row-${rowIndex}`}
        data-row-index={rowIndex}
        className={cn(
          'flex w-full items-center gap-3 py-2',
          variant === 'card' && 'flex-col gap-4',
          variant === 'text' && 'flex-col gap-2',
        )}
      >
        {Array.from({ length: columns }, (_, colIndex) => (
          <div
            key={`skeleton-cell-${rowIndex}-${colIndex}`}
            data-cell-index={colIndex}
            className={cn(
              'h-4 flex-1 rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
              variant === 'card' && 'h-48 w-full rounded-lg',
              variant === 'text' && 'h-3',
            )}
          />
        ))}
      </div>
    ));
  }, [columns, rows, variant]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full',
        animated ? 'animate-pulse' : '',
        className,
      )}
    >
      {placeholders}
      <span className="sr-only">Загрузка данных...</span>
    </div>
  );
});

export { SkeletonLoader };
export type { SkeletonLoaderProps };
