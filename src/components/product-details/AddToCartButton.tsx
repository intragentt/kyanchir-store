// Местоположение: src/components/product-details/AddToCartButton.tsx
'use client';

export default function AddToCartButton() {
  const handleAddToCart = () => {
    console.log('Кнопка "В корзину" нажата');
  };

  const handleCheckoutNow = () => {
    console.log('Кнопка "Оформить сейчас" нажата');
  };

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Создаем flex-контейнер для двух кнопок ---
    <div className="flex w-full items-center gap-x-3">
      {/* Кнопка "В корзину" - второстепенная, с обводкой */}
      <button
        onClick={handleAddToCart}
        className="font-body flex h-12 flex-1 items-center justify-center rounded-lg border border-[#272727] bg-transparent text-base font-medium text-[#272727] transition-colors hover:bg-gray-100"
      >
        В корзину
      </button>

      {/* Кнопка "Оформить сейчас" - основная, с заливкой */}
      <button
        onClick={handleCheckoutNow}
        className="font-body flex h-12 flex-1 items-center justify-center rounded-lg bg-[#272727] text-base font-medium text-white transition-opacity hover:opacity-80"
      >
        Оформить сейчас
      </button>
    </div>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}
