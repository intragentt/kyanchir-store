// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Category, Tag } from '@prisma/client';

import type { ProductForTable } from '@/app/admin/dashboard/page';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { VariantRow } from './VariantRow';

const statusConfig: Record<string, { dotClassName: string; label: string }> = {
  DRAFT: { dotClassName: 'bg-yellow-400', label: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', label: 'Опубликован' },
  ARCHIVED: { dotClassName: 'bg-gray-400', label: 'В архиве' },
};

const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '0 RUB';
  const priceInRubles = priceInCents / 100;

  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles);

  return `${formattedNumber} RUB`;
};

interface ProductTableRowProps {
  product: ProductForTable;
  allCategories: Category[];
  allTags: Tag[];
}

export const ProductTableRow = ({
  product,
  allCategories,
  allTags,
}: ProductTableRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const totalStock = product.variants.reduce(
    (sum, variant) =>
      sum + variant.sizes.reduce((s, size) => s + size.stock, 0),
    0,
  );

  const calculateTotalValue = () => {
    const totalValue = product.variants.reduce((sum, variant) => {
      // Суммируем стоимость каждого варианта (цена * кол-во)
      const variantValue = variant.sizes.reduce(
        (value, size) => value + (variant.price || 0) * size.stock,
        0,
      );
      return sum + variantValue;
    }, 0);
    return formatPrice(totalValue);
  };

  const rowClassName =
    isExpanded || isDetailsExpanded ? 'bg-indigo-50/50' : 'bg-white';

  return (
    <Fragment>
      <tr className={`border-t ${rowClassName} hover:bg-gray-50`}>
        <td className="w-24 px-4 py-4">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="grid flex-shrink-0 grid-cols-2 gap-1">
              <Image
                src={product.variants[0]?.images[0]?.url || '/placeholder.png'}
                alt={`${product.name} фото 1`}
                width={40}
                height={50}
                className="h-12 w-9 rounded object-cover"
              />
              <Image
                src={product.variants[0]?.images[1]?.url || '/placeholder.png'}
                alt={`${product.name} фото 2`}
                width={40}
                height={50}
                className="h-12 w-9 rounded object-cover"
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {product.name}
              </div>
              {product.variants.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <span>{product.variants.length} вариант(а)</span>
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="mt-1 flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                <PencilIcon className="h-3 w-3" />
                <span>Детали</span>
              </button>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-xs">
          {product.categories.map((c) => c.name).join(' / ')}
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-x-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                statusConfig[product.status.name]?.dotClassName
              }`}
            />
            {statusConfig[product.status.name]?.label || product.status.name}
          </span>
        </td>
        <td className="px-6 py-4 text-center text-sm">{totalStock} шт.</td>
        <td className="px-6 py-4 text-center text-sm">0 шт.</td>
        <td className="px-6 py-4 text-center text-sm font-bold">
          {calculateTotalValue()}
        </td>
        <td className="px-6 py-4 text-right">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="text-sm text-indigo-600"
          >
            Ред.
          </Link>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем colSpan и "мини-шапку" --- */}
          <td colSpan={8} className="p-0">
            <div className="border-l-4 border-indigo-200 bg-indigo-50/30">
              <table className="min-w-full">
                {/* Вот обновлённая "мини-шапка" */}
                <thead>
                  <tr className="bg-gray-100 text-xs uppercase text-gray-500">
                    <th className="w-24 px-4 py-2"></th> {/* Спейсер */}
                    <th className="px-6 py-2 text-left">Вариант</th>
                    <th className="w-40 px-6 py-2 text-center">Склад</th>
                    <th className="w-40 px-6 py-2 text-center">Бронь</th>
                    <th className="w-40 px-6 py-2 text-center">Старая цена</th>
                    <th className="w-40 px-6 py-2 text-center">Цена</th>
                    <th className="w-24 px-6 py-2"></th> {/* Спейсер */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {product.variants.map((variant) => (
                    <VariantRow key={variant.id} variant={variant} />
                  ))}
                </tbody>
              </table>
            </div>
          </td>
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
        </tr>
      )}
    </Fragment>
  );
};
