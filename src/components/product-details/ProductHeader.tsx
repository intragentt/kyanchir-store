// Местоположение: src/components/product-details/ProductHeader.tsx
'use client';

import { formatPrice } from '@/utils/formatPrice';

interface ProductHeaderProps {
  name: string;
  price: number;
  oldPrice?: number | null;
}

export default function ProductHeader({
  name,
  price,
  oldPrice,
}: ProductHeaderProps) {
  const hasDiscount = oldPrice && oldPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  const formattedPrice = formatPrice(price);
  const formattedOldPrice = hasDiscount ? formatPrice(oldPrice) : null;

  return (
    <div className="font-body text-text-primary text-base font-semibold">
      <div className="mb-[10px]">{name}</div>

      {/* VVV--- ИЗМЕНЕНИЕ: Оборачиваем все в flex-контейнер с justify-between ---VVV */}
      <div className="flex items-center justify-between">
        {/* Левая часть: основная и старая цена */}
        <div className="flex items-center gap-x-3">
          <span>{formattedPrice?.value} RUB</span>
          {hasDiscount && formattedOldPrice && (
            <span className="text-gray-400">
              <span className="line-through">{formattedOldPrice.value}</span>
              <span> RUB</span>
            </span>
          )}
        </div>

        {/* Правая часть: бейдж со скидкой (появится только если есть скидка) */}
        {hasDiscount && (
          <span className="rounded-md bg-[#E06F6F] px-2 py-0.5 text-sm text-white">
            -{discountPercent}%
          </span>
        )}
      </div>
    </div>
  );
}
