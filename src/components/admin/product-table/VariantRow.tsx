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
    };
  };
}>;

// --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем функцию форматирования для явного указания "RUB" ---
const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '0 RUB';
  const priceInRubles = priceInCents / 100;

  // Форматируем только число, без символа валюты
  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles);

  // Явно добавляем " RUB" в конце
  return `${formattedNumber} RUB`;
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface VariantRowProps {
  variant: VariantWithDetails;
}

export function VariantRow({ variant }: VariantRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalStock = variant.sizes.reduce((sum, size) => sum + size.stock, 0);

  return (
    <Fragment>
      <tr className="bg-white hover:bg-gray-50">
        <td className="flex w-24 items-center gap-2 px-4 py-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          {variant.sizes.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded-md p-1 hover:bg-gray-200 ${
                isExpanded ? 'bg-gray-200' : ''
              }`}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
          )}
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
              <div className="text-xs text-gray-500">
                {variant.sizes.length} размер(а)
              </div>
            </div>
          </div>
        </td>
        <td></td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm text-gray-600">
          {totalStock} шт.
        </td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm">
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-800">
              {formatPrice(variant.price)}
            </span>
            {variant.oldPrice && variant.oldPrice > variant.price && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(variant.oldPrice)}
              </span>
            )}
          </div>
        </td>
        <td className="w-24 whitespace-nowrap px-6 py-2 text-right text-sm font-medium">
          <a href="#" className="text-indigo-600 hover:text-indigo-900">
            Ред.
          </a>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-100">
                {variant.sizes.map((sizeInfo) => (
                  <ProductSizeRow key={sizeInfo.id} sizeInfo={sizeInfo} />
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
