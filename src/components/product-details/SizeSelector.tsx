// Местоположение: src/components/product-details/SizeSelector.tsx
'use client';

import LowStockBadge from './LowStockBadge';

interface InventoryItem {
  size: { id: string; value: string };
  stock: number;
}

interface SizeSelectorProps {
  inventory: InventoryItem[];
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}

const LOW_STOCK_THRESHOLD = 9;

export default function SizeSelector({
  inventory,
  selectedSize,
  onSelectSize,
}: SizeSelectorProps) {
  return (
    <div>
      <div className="font-body text-base font-semibold text-gray-500">
        Выберите размер
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {inventory.map(({ size, stock }) => {
          const isSelected = selectedSize === size.value;
          const isOutOfStock = stock === 0;
          const isLowStock = stock > 0 && stock <= LOW_STOCK_THRESHOLD;

          return (
            <div key={size.id} className="relative pt-3">
              {isLowStock && <LowStockBadge stock={stock} />}

              {/* 
                ИЗМЕНЕНИЕ: Мы заменили жесткие размеры на 'clamp()'.
                Теперь и размер кнопок, и размер шрифта будут плавно меняться
                в зависимости от ширины экрана, оставаясь в заданных пределах.
              */}
              <button
                onClick={() => onSelectSize(size.value)}
                disabled={isOutOfStock}
                className={`flex h-[clamp(2.75rem,13.75vw,3.5rem)] w-[clamp(2.75rem,13.75vw,3.5rem)] items-center justify-center rounded-lg border text-[clamp(1rem,5vw,1.125rem)] font-medium transition-colors ${
                  isOutOfStock
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : isSelected
                      ? 'border-[#272727] bg-[#272727] text-white'
                      : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
                } `}
              >
                {size.value}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
