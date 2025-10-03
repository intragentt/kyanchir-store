// Местоположение: src/components/product-details/SizeSelector.tsx
'use client';

import LowStockBadge from './LowStockBadge';
import HeartIcon from '../icons/HeartIcon';

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
  const handleWishlistClick = (sizeValue: string) => {
    console.log(
      `Пользователь хочет получить уведомление о поступлении размера: ${sizeValue}`,
    );
  };

  return (
    <div className="flex flex-wrap gap-4">
      {inventory.map(({ size, stock }) => {
        const isSelected = selectedSize === size.value;
        const isOutOfStock = stock === 0;
        const isLowStock = stock > 0 && stock <= LOW_STOCK_THRESHOLD;

        return (
          <div key={size.id} className="relative pt-3">
            {isOutOfStock ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleWishlistClick(size.value);
                }}
                className="absolute top-0 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300"
                aria-label="Сообщить о поступлении"
              >
                <HeartIcon className="h-4 w-4" />
              </button>
            ) : isLowStock ? (
              <LowStockBadge stock={stock} />
            ) : null}

            {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Уменьшены значения в clamp() для кнопок и текста --- */}
            <button
              onClick={() => onSelectSize(size.value)}
              disabled={isOutOfStock}
              className={`flex h-[clamp(3.1rem,15.5vw,3.8rem)] w-[clamp(3.1rem,15.5vw,3.8rem)] items-center justify-center rounded-lg border text-[clamp(1rem,5vw,1.25rem)] font-medium transition-colors ${
                isOutOfStock
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                  : isSelected
                    ? 'border-[#272727] bg-[#272727] text-white'
                    : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
              } `}
            >
              {size.value}
            </button>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
          </div>
        );
      })}
    </div>
  );
}
