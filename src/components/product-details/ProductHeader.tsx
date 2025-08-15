// Местоположение: src/components/product-details/ProductHeader.tsx
'use client';

import { formatPrice } from '@/utils/formatPrice';
import ShortLogo from '../icons/ShortLogo';

interface ProductHeaderProps {
  name: string;
  price: number;
  oldPrice?: number | null;
  bonusPoints?: number | null;
  isDiscountActive: boolean;
}

const formatBonusPoints = (points: number) => {
  return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const BonusPointsBadge = ({
  points,
}: {
  points: number | null | undefined;
}) => {
  if (!points || points <= 0) return null;
  return (
    <div className="ml-4 inline-flex flex-shrink-0 items-center gap-x-1.5 rounded-md bg-[#6B80C5]/10 px-2 py-1 text-sm font-bold text-[#6B80C5]">
      <span>+{formatBonusPoints(points)}</span>
      <ShortLogo className="h-3.5 w-3.5" />
    </div>
  );
};

export default function ProductHeader({
  name,
  price,
  oldPrice,
  bonusPoints,
  isDiscountActive,
}: ProductHeaderProps) {
  const hasDiscount = isDiscountActive && oldPrice && oldPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Логика выбора правильной цены для отображения ---
  // Если скидка активна, показываем цену со скидкой.
  // Если скидка ЗАКОНЧИЛАСЬ, показываем старую цену (oldPrice).
  // Если скидки не было, показываем обычную цену.
  const displayPrice = hasDiscount ? price : (oldPrice || price);
  const formattedDisplayPrice = formatPrice(displayPrice);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const formattedOldPrice = hasDiscount ? formatPrice(oldPrice) : null;

  return (
    <div className="font-body text-text-primary text-base font-semibold">
      <div className="flex items-start justify-between">
        <div className="text-lg">{name}</div>
        <BonusPointsBadge points={bonusPoints} />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          {/* --- ИЗМЕНЕНИЕ: Используем новую переменную для отображения цены --- */}
          <span>{formattedDisplayPrice?.value} RUB</span>
          {hasDiscount && formattedOldPrice && (
            <span className="text-gray-400">
              <span className="line-through">{formattedOldPrice.value}</span>
              <span> RUB</span>
            </span>
          )}
        </div>

        {hasDiscount && (
          <span className="rounded-md bg-[#E06F6F] px-2 py-1 text-sm font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
      </div>
    </div>
  );
}