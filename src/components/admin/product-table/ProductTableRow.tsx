// Местоположение: src/components/admin/product-table/ProductTableRow.tsx

'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { OptimizedProductForTable } from '@/app/admin/dashboard/page';

interface ProductTableRowProps {
  product: OptimizedProductForTable;
  isEditMode: boolean;
}

// Мемоизированный компонент для предотвращения лишних рендеров
const ProductTableRow = memo(function ProductTableRow({
  product,
  isEditMode,
}: ProductTableRowProps) {
  const firstVariant = product.variants[0];
  const firstImage = firstVariant?.images[0];

  // Подсчет общего остатка
  const totalStock = product.variants.reduce(
    (acc, variant) =>
      acc + variant.sizes.reduce((sacc, size) => sacc + size.stock, 0),
    0,
  );

  return (
    <tr className="hover:bg-gray-50">
      <td className="w-12 px-2 py-4">
        {isEditMode && (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}
      </td>

      <td className="w-12 px-2 py-4">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ↗
        </Link>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 flex-shrink-0">
            {firstImage ? (
              <Image
                className="h-12 w-12 rounded-lg object-cover"
                src={firstImage.url}
                alt={product.name}
                width={48}
                height={48}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                <span className="text-xs text-gray-400">Нет фото</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-900">
              {product.name}
            </div>
            {product.article && (
              <div className="text-sm text-gray-500">
                Арт: {product.article}
              </div>
            )}
            <div className="text-xs text-gray-400">
              {product.variants.length} вариант(ов) •{' '}
              {product._count.attributes} атрибут(ов)
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            product.status.name === 'PUBLISHED'
              ? 'bg-green-100 text-green-800'
              : product.status.name === 'DRAFT'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {product.status.name}
        </span>
      </td>

      <td className="px-6 py-4">
        {firstVariant && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">
              {firstVariant.price.toLocaleString()} ₽
            </div>
            {firstVariant.oldPrice && (
              <div className="text-xs text-gray-500 line-through">
                {firstVariant.oldPrice.toLocaleString()} ₽
              </div>
            )}
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{totalStock} шт.</div>
        <div className="text-xs text-gray-500">
          {product.variants.length > 1 &&
            `${product.variants.length} вариантов`}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            Редактировать
          </Link>
        </div>
      </td>
    </tr>
  );
});

export { ProductTableRow };
