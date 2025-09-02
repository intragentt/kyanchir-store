// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Prisma, Category, Tag } from '@prisma/client';

import { formatPrice } from '@/utils/formatPrice';
import type { ProductForTable } from '@/app/admin/dashboard/page';
import { VariantRow } from './VariantRow'; // Импортируем наш новый дочерний компонент

// Иконки и типы
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
type VariantData = ProductForTable['variants'][0];

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
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set(),
  );

  // (Здесь будет возвращена вся логика хендлеров handleUpdate, handleSave и т.д.)
  // Сейчас для простоты оставим ее за рамками, чтобы сфокусироваться на отображении.

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

  const handleSelectProduct = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allVariantIds = new Set(productState.variants.map((v) => v.id));
    if (e.target.checked) {
      setSelectedVariantIds(allVariantIds);
    } else {
      setSelectedVariantIds(new Set());
    }
  };

  const isProductSelected = selectedVariantIds.size > 0;
  const areAllVariantsSelected =
    selectedVariantIds.size === productState.variants.length;

  return (
    <Fragment>
      {/* --- ГЛАВНАЯ СТРОКА ПРОДУКТА --- */}
      <tr className="border-t bg-white hover:bg-gray-50">
        <td className="relative flex w-12 items-center justify-center gap-2 px-1 py-4 text-center">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={areAllVariantsSelected}
            ref={(input) => {
              if (input)
                input.indeterminate =
                  isProductSelected && !areAllVariantsSelected;
            }}
            onChange={handleSelectProduct}
          />
          {productState.variants.length > 1 && (
            <button onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </td>
        <td className="px-6 py-4">
          {/* ... Отображение основной информации ... */}
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <Image
                src={
                  productState.variants[0]?.images[0]?.url || '/placeholder.png'
                }
                alt={productState.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-cover"
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
        <td className="px-6 py-4">{/* ... Категории ... */}</td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-x-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusConfig[productState.status].dotClassName}`}
            />
            {statusConfig[productState.status].label}
          </span>
        </td>
        <td className="px-6 py-4 text-center text-sm">{totalStock} шт.</td>
        <td className="px-6 py-4 text-center text-sm font-bold">
          {formattedPrice?.value} RUB
        </td>
        <td className="px-6 py-4">
          <Link
            href={`/admin/products/${productState.id}/edit`}
            className="text-indigo-600"
          >
            Ред.
          </Link>
        </td>
      </tr>

      {/* --- ВЛОЖЕННЫЕ ВАРИАНТЫ --- */}
      {isExpanded &&
        productState.variants.map((variant) => (
          // <VariantRow key={variant.id} variant={variant} ... />
          // Заглушка, т.к. код VariantRow был в твоем предыдущем файле, который мы перезаписали.
          // Нужно его вынести в отдельный компонент /src/components/admin/product-table/VariantRow.tsx
          <tr key={variant.id} className="bg-gray-50">
            <td className="w-12 border-l-4 border-indigo-200 px-1 py-2 text-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
            </td>
            <td colSpan={2} className="px-6 py-3 whitespace-nowrap">
              {/* Детали варианта (цвет, размер, SKU) */}
            </td>
            <td className="px-6 py-3"> {/* Пусто для статуса */} </td>
            <td className="px-6 py-3"> {/* Редактируемые остатки */} </td>
            <td className="px-6 py-3"> {/* Редактируемые цены */} </td>
            <td className="px-6 py-3"> {/* Пусто */} </td>
          </tr>
        ))}
    </Fragment>
  );
};
