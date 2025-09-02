// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Prisma, Category, Tag } from '@prisma/client';

import { formatPrice } from '@/utils/formatPrice';
import type { ProductForTable } from '@/app/admin/dashboard/page';

// ИКОНКИ (упрощенно)
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

// Типы
type ProductStatus = Prisma.ProductGetPayload<{}>['status'];
const statusConfig: Record<
  ProductStatus,
  { dotClassName: string; label: string }
> = {
  DRAFT: { dotClassName: 'bg-yellow-400', label: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', label: 'Опубликован' },
  ARCHIVED: { dotClassName: 'bg-gray-400', label: 'В архиве' },
};
type VariantRowData = ProductForTable['variants'][0];

// Props для компонента
interface ProductTableRowProps {
  product: ProductForTable;
  allCategories: Category[];
  allTags: Tag[];
}

export const ProductTableRow = ({
  product: initialProduct,
  allCategories,
  allTags,
}: ProductTableRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [productState, setProductState] = useState(initialProduct);

  const totalStock = productState.variants.reduce((acc, variant) => {
    return acc + variant.inventory.reduce((sum, inv) => sum + inv.stock, 0);
  }, 0);

  const priceRange = () => {
    if (productState.variants.length === 0) return formatPrice(0);
    if (productState.variants.length === 1)
      return formatPrice(productState.variants[0].price);

    const prices = productState.variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return formatPrice(minPrice);

    return {
      value: `${formatPrice(minPrice)?.value} - ${formatPrice(maxPrice)?.value}`,
      currency: 'RUB',
    };
  };

  const formattedPrice = priceRange();

  return (
    <Fragment>
      {/* --- ГЛАВНАЯ СТРОКА ПРОДУКТА (ТОЛЬКО ДЛЯ ЧТЕНИЯ) --- */}
      <tr className="border-t bg-white hover:bg-gray-50">
        <td className="relative px-1 py-4 text-center">
          {productState.variants.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <Image
                className="h-10 w-10 rounded-md object-cover"
                src={
                  productState.variants[0]?.images[0]?.url || '/placeholder.png'
                }
                alt={productState.name}
                width={40}
                height={40}
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {productState.name}
              </div>
              <div className="text-sm text-gray-500">
                {productState.variants.length} вариант(а)
              </div>
            </div>
          </div>
        </td>
        <td
          className="px-6 py-4 text-xs text-gray-500"
          style={{ maxWidth: '200px' }}
        >
          <div className="flex flex-col gap-1">
            {productState.categories.map((cat) => (
              <span key={cat.id} className="rounded bg-gray-100 px-2 py-0.5">
                {cat.name}
              </span>
            ))}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center gap-x-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusConfig[productState.status].dotClassName}`}
            />
            {statusConfig[productState.status].label}
          </span>
        </td>
        <td className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
          {totalStock} шт.
        </td>
        <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-900">
          {formattedPrice
            ? `${formattedPrice.value} ${formattedPrice.currency}`
            : '-'}
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
          <Link
            href={`/admin/products/${productState.id}/edit`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Ред.
          </Link>
        </td>
      </tr>

      {/* --- ВЛОЖЕННЫЕ РЕДАКТИРУЕМЫЕ СТРОКИ ДЛЯ ВАРИАНТОВ --- */}
      {isExpanded &&
        productState.variants.map((variant) => {
          // Здесь мы вернем "старую" логику рендеринга и редактирования, но для одного варианта
          const formattedVariantPrice = formatPrice(variant.price);
          const formattedOldPrice = formatPrice(variant.oldPrice);

          return (
            // Этот компонент мы можем сделать на следующем шаге, он будет называться <VariantRow>
            // А пока — упрощенная версия
            <tr
              key={variant.id}
              className="border-l-4 border-indigo-200 bg-gray-50"
            >
              <td></td>
              <td colSpan={2} className="px-6 py-3 whitespace-nowrap">
                <div className="ml-10 flex items-center">
                  <Image
                    src={variant.images[0]?.url || '/placeholder.png'}
                    width={32}
                    height={32}
                    alt=""
                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                  />
                  <div className="ml-4">
                    <div className="text-xs font-medium text-gray-800">
                      {variant.color || 'Базовый'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Размер: {variant.inventory[0]?.size.value || 'N/A'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3"> {/* Пусто для статуса */} </td>
              <td className="px-6 py-3 text-center text-sm text-gray-500">
                <input
                  type="number"
                  defaultValue={variant.inventory[0]?.stock || 0}
                  className="w-16 rounded-md border-gray-300 p-1 text-center"
                />{' '}
                шт.
              </td>
              <td className="px-6 py-3 text-center text-sm text-gray-900">
                <div className="flex items-center justify-center gap-1">
                  {formattedOldPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {formattedOldPrice.value}
                    </span>
                  )}
                  <input
                    type="number"
                    defaultValue={variant.price / 100} // Сразу делим, чтобы показать рубли
                    className="w-20 rounded-md border-gray-300 p-1 text-center font-bold"
                  />
                  RUB
                </div>
              </td>
              <td></td>
            </tr>
          );
        })}
    </Fragment>
  );
};
