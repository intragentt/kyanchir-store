// Местоположение: src/components/product-details/AddToCartButton.tsx
'use client';

interface AddToCartButtonProps {
  quantity: number;
  onAddToCart: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isAddToCartDisabled: boolean;
  isIncreaseDisabled: boolean;
}

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

export default function AddToCartButton({
  quantity,
  onAddToCart,
  onIncrease,
  onDecrease,
  isAddToCartDisabled,
  isIncreaseDisabled,
}: AddToCartButtonProps) {
  const handleCheckoutNow = () => {
    console.log('Кнопка "Оформить сейчас" нажата');
  };

  return (
    <div className="flex w-full items-center gap-x-3">
      {quantity === 0 ? (
        <button
          onClick={onAddToCart}
          disabled={isAddToCartDisabled}
          className="font-body flex h-14 flex-1 items-center justify-center rounded-lg border border-[#272727] bg-transparent text-base font-medium text-[#272727] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
        >
          В корзину
        </button>
      ) : (
        <div className="flex h-14 flex-1 items-center justify-between rounded-lg border border-[#272727]">
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

      <button
        onClick={handleCheckoutNow}
        className="font-body flex h-14 flex-1 items-center justify-center rounded-lg bg-[#272727] text-base font-medium text-white transition-opacity hover:opacity-80"
      >
        Оформить сейчас
      </button>
    </div>
  );
}
