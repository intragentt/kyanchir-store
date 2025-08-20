// Местоположение: src/components/product-details/DesktopSizeAndCartButton.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';

// --- Иконки для счетчика ---
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

// --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем "должностную инструкцию" (Props) ---
// Мы добавляем все недостающие "пункты", которые требует ProductDetails.tsx
interface DesktopSizeAndCartButtonProps {
  inventory: Array<{ size: { value: string }; stock: number }>;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  quantity: number;
  onAddToCart: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isAddToCartDisabled: boolean;
  isIncreaseDisabled: boolean;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function DesktopSizeAndCartButton({
  inventory,
  selectedSize,
  onSelectSize,
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Принимаем все новые "приказы" ---
  quantity,
  onAddToCart,
  onIncrease,
  onDecrease,
  isAddToCartDisabled,
  isIncreaseDisabled,
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}: DesktopSizeAndCartButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  const handleSizeSelect = (sizeValue: string) => {
    onSelectSize(sizeValue);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex w-full items-center gap-x-3">
      <div className="relative w-2/5" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex h-14 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left transition-colors hover:bg-gray-50"
        >
          <span className="font-body text-base font-medium text-gray-800">
            {selectedSize || 'Размер'}
          </span>
          <ChevronIcon isOpen={isDropdownOpen} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            {inventory.map((item) => (
              <button
                key={item.size.value}
                onClick={() => handleSizeSelect(item.size.value)}
                disabled={item.stock === 0}
                className="font-body block w-full px-4 py-2 text-left text-base font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {item.size.value}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем логику для отображения либо кнопки, либо счетчика --- */}
      <div className="w-3/5">
        {quantity === 0 ? (
          <Button
            onClick={onAddToCart}
            disabled={isAddToCartDisabled}
            variant="accent-solid"
            className="h-14 w-full"
            style={{ backgroundColor: '#6B80C5' }}
          >
            В корзину
          </Button>
        ) : (
          <div className="flex h-14 w-full items-center justify-between rounded-lg border border-[#272727]">
            <button
              onClick={onDecrease}
              className="flex h-full w-14 items-center justify-center text-[#272727] transition-colors hover:bg-gray-100"
              aria-label="Уменьшить количество"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
            <span className="font-body text-base font-bold text-[#272727]">
              {quantity}
            </span>
            <button
              onClick={onIncrease}
              disabled={isIncreaseDisabled}
              className="flex h-full w-14 items-center justify-center text-[#272727] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Увеличить количество"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
