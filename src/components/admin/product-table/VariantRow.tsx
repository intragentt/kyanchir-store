// Местоположение: /src/components/admin/product-table/VariantRow.tsx
'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import type { Prisma } from '@prisma/client';

import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { ProductSizeRow } from './ProductSizeRow';

type VariantWithDetails = Prisma.ProductVariantGetPayload<{
  include: {
    images: true;
    sizes: {
      include: {
        size: true;
      };
      select: {
        id: true;
        stock: true;
        size: true;
        moySkladHref: true;
        moySkladType: true;
        price: true;
        oldPrice: true;
      };
    };
  };
}> & {
  price: number | null;
  oldPrice: number | null;
  moySkladId?: string | null;
};

const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '0 RUB';
  const priceInRubles = priceInCents / 100;
  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles)} RUB`;
};

interface VariantRowProps {
  variant: VariantWithDetails;
}

export function VariantRow({ variant }: VariantRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalStock = variant.sizes.reduce((sum, size) => sum + size.stock, 0);

  const totalSalePrice = variant.sizes.reduce(
    (sum, size) => sum + (size.price ?? variant.price ?? 0) * size.stock,
    0,
  );

  const totalOldPrice = variant.sizes.reduce((sum, size) => {
    const resolvedPrice = size.price ?? variant.price;
    const resolvedOldPrice = size.oldPrice ?? variant.oldPrice;

    const priceForOldSum =
      resolvedPrice !== null &&
      resolvedOldPrice !== null &&
      resolvedOldPrice > resolvedPrice
        ? resolvedOldPrice
        : resolvedPrice;

    return sum + (priceForOldSum ?? 0) * size.stock;
  }, 0);

  return (
    <Fragment>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer bg-white hover:bg-gray-50"
      >
        <td className="w-24 px-4 py-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>
        <td className="whitespace-nowrap px-6 py-2">
          <div className="flex items-center">
            <Image
              src={variant.images[0]?.url || '/placeholder.png'}
              alt={variant.color || 'variant'}
              width={32}
              height={40}
              className="h-10 w-8 rounded object-cover"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-800">
                {variant.color || 'Основной'}
              </div>
              {variant.sizes.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{variant.sizes.length} размер</span>
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="w-40 px-6 py-2 text-center text-sm">0 шт.</td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm text-gray-600">
          {totalStock} шт.
        </td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm text-gray-500">
          {formatPrice(totalOldPrice)}
        </td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm font-bold text-gray-800">
          {formatPrice(totalSalePrice)}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Обновлены colSpan и ширина колонок --- */}
          <td colSpan={6} className="p-0">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="w-24 px-4 py-2"></th>
                  <th className="px-6 py-2 text-left">Размер</th>
                  <th className="w-32 px-6 py-2 text-center">Бронь</th>
                  <th className="w-32 px-6 py-2 text-center">Склад</th>
                  <th className="w-32 px-6 py-2 text-center">Старая цена</th>
                  <th className="w-32 px-6 py-2 text-center">Скидка %</th>
                  <th className="w-32 px-6 py-2 text-center">Цена</th>
                  <th className="w-32 px-6 py-2 text-center">Сумма</th>
                  <th className="w-24 px-6 py-2"></th>
                </tr>
              </thead>
              {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
              <tbody className="divide-y divide-gray-100">
                {variant.sizes.map((sizeInfo) => (
                  <ProductSizeRow
                    key={sizeInfo.id}
                    sizeInfo={sizeInfo as any}
                    variantPrice={variant.price}
                    variantOldPrice={variant.oldPrice}
                  />
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
