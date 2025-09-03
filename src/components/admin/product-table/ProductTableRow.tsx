// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Prisma, Category, Tag } from '@prisma/client';

import type { ProductForTable } from '@/app/admin/dashboard/page';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { VariantRow } from './VariantRow'; // Мы адаптируем этот компонент на следующем шаге

// import { ProductDetailsPanel } from './ProductDetailsPanel'; // Панель деталей пока отключим

type ProductStatus = ProductForTable['status'];
const statusConfig: Record<
  ProductStatus,
  { dotClassName: string; label: string }
> = {
  DRAFT: { dotClassName: 'bg-yellow-400', label: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', label: 'Опубликован' },
  ARCHIVED: { dotClassName: 'bg-gray-400', label: 'В архиве' },
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

  // Считаем сводные данные по продукту, используя новую структуру данных
  const totalStock = product.variants.reduce(
    (sum, variant) =>
      sum + variant.sizes.reduce((s, size) => s + size.stock, 0),
    0,
  );

  const priceRange = () => {
    const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
    if (prices.length === 0) return '0 RUB';
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return `${minPrice} RUB`;
    return `${minPrice} - ${maxPrice} RUB`;
  };

  const rowClassName =
    isExpanded || isDetailsExpanded ? 'bg-indigo-50/50' : 'bg-white';

  return (
    <Fragment>
      {/* Главная строка продукта. Отвечает только за сводную информацию. */}
      <tr className={`border-t ${rowClassName} hover:bg-gray-50`}>
        <td className="flex w-24 items-center gap-2 px-4 py-4">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          {product.variants.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded-md p-1 hover:bg-gray-200 ${isExpanded ? 'bg-indigo-100 text-indigo-700' : ''}`}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
          )}
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
              <div className="text-xs text-gray-500">
                {product.variants.length} вариант(а)
              </div>
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
              className={`h-1.5 w-1.5 rounded-full ${statusConfig[product.status]?.dotClassName}`}
            />
            {statusConfig[product.status]?.label || product.status}
          </span>
        </td>
        <td className="px-6 py-4 text-center text-sm">{totalStock} шт.</td>
        <td className="px-6 py-4 text-center text-sm font-bold">
          {priceRange()}
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

      {/* {isDetailsExpanded && <ProductDetailsPanel product={product} />} */}

      {/* Раскрывающаяся часть, которая рендерит дочерние компоненты VariantRow */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <div className="border-l-4 border-indigo-200 bg-indigo-50/30">
              <table className="min-w-full">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="w-24 px-4 py-2 text-left"></th>
                    <th className="px-6 py-2 text-left">Вариант</th>
                    <th className="px-6 py-2 text-left"></th>
                    <th className="w-40 px-6 py-2 text-center">Остатки</th>
                    <th className="w-40 px-6 py-2 text-center">Цена</th>
                    <th className="w-24 px-6 py-2 text-center"></th>
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
        </tr>
      )}
    </Fragment>
  );
};
