// Местоположение: src/components/product-details/AddToCartButton.tsx
'use client';

interface AddToCartButtonProps {}

export default function AddToCartButton({}: AddToCartButtonProps) {
  const handleAddToCart = () => {
    console.log('Кнопка "Добавить в корзину" нажата');
  };

  return (
    <button
      onClick={handleAddToCart}
      // --- ИЗМЕНЕНИЕ: Возвращаем py-2 и добавляем min-h-12 ---
      className="font-body flex min-h-12 w-full items-center justify-center rounded-lg bg-[#272727] py-2 text-base font-medium text-white transition-opacity hover:opacity-80"
    >
      Добавить в корзину
    </button>
  );
}
