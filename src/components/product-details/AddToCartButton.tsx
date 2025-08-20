// Местоположение: src/components/product-details/AddToCartButton.tsx
'use client';

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

// --- НАЧАЛО ИЗМЕНЕНИЙ: Правильная "должностная инструкция" для этого компонента ---
// Убираем все лишнее (inventory, selectedSize) и оставляем только то,
// что действительно нужно для кнопки и счетчика.
interface AddToCartButtonProps {
  quantity: number;
  onAddToCart: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isAddToCartDisabled: boolean;
  isIncreaseDisabled: boolean;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function AddToCartButton({
  quantity,
  onAddToCart,
  onIncrease,
  onDecrease,
  isAddToCartDisabled,
  isIncreaseDisabled,
}: AddToCartButtonProps) {
  // Логика отображения кнопки или счетчика
  return (
    <>
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
    </>
  );
}
