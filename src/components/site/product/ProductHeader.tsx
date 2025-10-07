// Местоположение: src/components/product-details/ProductHeader.tsx
'use client';

import { ShortLogo } from '@/components/shared/icons';
import { formatPrice } from '@/utils/formatPrice';

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

  const displayPrice = hasDiscount ? price : oldPrice || price;
  const formattedDisplayPrice = formatPrice(displayPrice);

  const formattedOldPrice = hasDiscount ? formatPrice(oldPrice) : null;

  return (
    <div className="font-body text-text-primary text-base font-semibold">
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Бейджи поменяны местами --- */}
      {/* Блок с ценой и БОНУСАМИ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <span>{formattedDisplayPrice?.value} RUB</span>
          {hasDiscount && formattedOldPrice && (
            <span className="text-gray-400">
              <span className="line-through">{formattedOldPrice.value}</span>
              <span> RUB</span>
            </span>
          )}
        </div>
        <BonusPointsBadge points={bonusPoints} />
      </div>

      {/* Блок с названием и СКИДКОЙ */}
      <div className="mt-2 flex items-start justify-between">
        <div>{name}</div>
        {hasDiscount && (
          <span className="ml-4 rounded-md bg-[#E06F6F] px-2 py-1 text-sm font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
      </div>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
