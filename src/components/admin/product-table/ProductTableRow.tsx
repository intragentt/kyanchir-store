// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Prisma, Category, Tag } from '@prisma/client';

// 1. Импортируем новый тип для продукта
import type { ProductForTable } from '@/app/admin/dashboard/page';
import { formatPrice } from '@/utils/formatPrice'; // Наша умная функция форматирования

// --- ИКОНКИ ---
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

type ProductStatus = Prisma.ProductGetPayload<{}>['status'];
const statusConfig: Record<
  ProductStatus,
  { dotClassName: string; label: string }
> = {
  DRAFT: { dotClassName: 'bg-yellow-400', label: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', label: 'Опубликован' },
  ARCHIVED: { dotClassName: 'bg-gray-400', label: 'В архиве' },
};

// 2. ОБНОВЛЕННЫЕ PROPS КОМПОНЕНТА
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
  // 3. НОВОЕ СОСТОЯНИЕ ДЛЯ "РАСКРЫТИЯ"
  const [isExpanded, setIsExpanded] = useState(false);
  const [productState, setProductState] = useState(product); // Локальное состояние для редактирования

  const totalStock = product.variants.reduce((acc, variant) => {
    return acc + variant.inventory.reduce((sum, inv) => sum + inv.stock, 0);
  }, 0);

  // Средняя цена (для отображения в главной строке)
  const averagePrice =
    product.variants.length > 0
      ? product.variants.reduce((acc, v) => acc + v.price, 0) /
        product.variants.length
      : 0;

  // 4. Используем нашу умную функцию форматирования цен
  const formattedAvgPrice = formatPrice(averagePrice);

  return (
    // 5. Fragment позволяет нам рендерить несколько <tr> как единый блок
    <Fragment>
      {/* --- ГЛАВНАЯ СТРОКА ПРОДУКТА --- */}
      <tr className="bg-white hover:bg-gray-50">
        <td className="relative px-1 py-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-50"
            disabled={product.variants.length <= 1} // Блокируем, если только 1 вариант
            aria-label={
              isExpanded ? 'Свернуть варианты' : 'Развернуть варианты'
            }
          >
            {product.variants.length > 1 &&
              (isExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              ))}
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <Image
                className="h-10 w-10 rounded-md object-cover"
                src={product.variants[0]?.images[0]?.url || '/placeholder.png'}
                alt={product.name}
                width={40}
                height={40}
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {product.name}
              </div>
              <div className="text-sm text-gray-500">
                {product.variants.length} вариант(а)
              </div>
            </div>
          </div>
        </td>
        <td
          className="px-6 py-4 text-sm text-gray-500"
          style={{ maxWidth: '200px' }}
        >
          {/* Отображение категорий (логика для отрисовки "хлебных крошек" может быть сложнее) */}
          {product.categories.map((cat) => cat.name).join(' / ')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center gap-x-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusConfig[product.status].dotClassName}`}
            />
            {statusConfig[product.status].label}
          </span>
        </td>
        <td className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
          {totalStock} шт.
        </td>
        <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-900">
          {formattedAvgPrice
            ? `${formattedAvgPrice.value} ${formattedAvgPrice.currency}`
            : '-'}
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Редактировать
          </Link>
        </td>
      </tr>

      {/* --- ВЛОЖЕННЫЕ СТРОКИ ДЛЯ ВАРИАНТОВ (показываются только если isExpanded === true) --- */}
      {isExpanded &&
        product.variants.map((variant) => {
          const formattedVariantPrice = formatPrice(variant.price);
          const formattedOldPrice = formatPrice(variant.oldPrice);
          const totalVariantStock = variant.inventory.reduce(
            (sum, inv) => sum + inv.stock,
            0,
          );

          return (
            <tr key={variant.id} className="bg-gray-50">
              <td className="px-1 py-2 text-center">
                <div className="flex justify-center">
                  <div className="h-6 w-px bg-gray-300" />
                </div>
              </td>
              <td colSpan={3} className="px-6 py-2 whitespace-nowrap">
                <div className="ml-10 flex items-center">
                  <div className="h-8 w-8 flex-shrink-0">
                    <Image
                      className="h-8 w-8 rounded-md object-cover"
                      src={variant.images[0]?.url || '/placeholder.png'}
                      alt={variant.color || ''}
                      width={32}
                      height={32}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-xs font-medium text-gray-800">
                      {variant.color || 'Базовый'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Размеры:{' '}
                      {variant.inventory
                        .map((inv) => inv.size.value)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-2 text-center text-xs whitespace-nowrap text-gray-500">
                {totalVariantStock} шт.
              </td>
              <td className="px-6 py-2 text-center text-xs whitespace-nowrap">
                {formattedOldPrice && (
                  <span className="mr-2 text-gray-400 line-through">{`${formattedOldPrice.value} ${formattedOldPrice.currency}`}</span>
                )}
                {formattedVariantPrice
                  ? `${formattedVariantPrice.value} ${formattedVariantPrice.currency}`
                  : '-'}
              </td>
              <td></td>
            </tr>
          );
        })}
    </Fragment>
  );
};
