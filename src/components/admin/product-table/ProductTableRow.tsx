// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Prisma, Category, Tag } from '@prisma/client';

import { formatPrice } from '@/utils/formatPrice';
import type { ProductForTable } from '@/app/admin/dashboard/page';

// --- НАЧАЛО ИСПРАВЛЕНИЯ: ТОЧЕЧНЫЕ ИМПОРТЫ ДЛЯ КАЖДОЙ ИКОНКИ ---
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
// --- КОНЕЦ ИСПРАВЛЕНИЯ ---
import { VariantRow } from './VariantRow';
import { ProductDetailsPanel } from './ProductDetailsPanel';

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
  product: initialProduct,
  allCategories,
  allTags,
}: ProductTableRowProps) => {
  const [productState, setProductState] = useState(initialProduct);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set(),
  );

  const handleVariantUpdate = (
    variantId: string,
    updatedData: Partial<Prisma.VariantGetPayload<{}>>,
  ) => {
    setProductState((prevState) => ({
      ...prevState,
      variants: prevState.variants.map((v) =>
        v.id === variantId ? { ...v, ...updatedData } : v,
      ),
    }));
  };

  const handleProductUpdate = (
    productId: string,
    updatedData: Partial<Prisma.ProductGetPayload<{}>>,
  ) => {
    setProductState((prevState) => ({
      ...prevState,
      ...updatedData,
    }));
  };

  const handleSelectVariant = (variantId: string, isSelected: boolean) => {
    setSelectedVariantIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(variantId);
      else newSet.delete(variantId);
      return newSet;
    });
  };

  const handleSelectAllVariants = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVariantIds(new Set(productState.variants.map((v) => v.id)));
    } else {
      setSelectedVariantIds(new Set());
    }
  };

  const totalStock = productState.variants.reduce(
    (acc, v) => acc + v.inventory.reduce((sum, i) => sum + i.stock, 0),
    0,
  );

  const priceRange = () => {
    const prices = productState.variants
      .map((v) => v.price)
      .filter((p) => p !== null) as number[];
    if (prices.length === 0) return formatPrice(0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return formatPrice(minPrice);
    return {
      value: `${formatPrice(minPrice)?.value} - ${formatPrice(maxPrice)?.value}`,
      currency: 'RUB',
    };
  };
  const formattedPrice = priceRange();

  const areAllVariantsSelected =
    selectedVariantIds.size === productState.variants.length &&
    productState.variants.length > 0;
  const isPartiallySelected =
    selectedVariantIds.size > 0 && !areAllVariantsSelected;

  const rowClassName =
    isExpanded || isDetailsExpanded ? 'bg-indigo-50/50' : 'bg-white';

  return (
    <Fragment>
      <tr className={`border-t ${rowClassName} hover:bg-gray-50`}>
        <td className="flex w-24 items-center gap-2 px-4 py-4">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={areAllVariantsSelected}
            ref={(input) => {
              if (input) input.indeterminate = isPartiallySelected;
            }}
            onChange={handleSelectAllVariants}
          />
          {productState.variants.length > 0 && (
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
                src={
                  productState.variants[0]?.images[0]?.url || '/placeholder.png'
                }
                alt={`${productState.name} фото 1`}
                width={40}
                height={50}
                className="h-12 w-9 rounded object-cover"
              />
              <Image
                src={
                  productState.variants[0]?.images[1]?.url || '/placeholder.png'
                }
                alt={`${productState.name} фото 2`}
                width={40}
                height={50}
                className="h-12 w-9 rounded object-cover"
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {productState.name}
              </div>
              <div className="text-xs text-gray-500">
                {productState.variants.length} вариант(а)
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
          {productState.categories.map((c) => c.name).join(' / ')}
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-x-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusConfig[productState.status]?.dotClassName}`}
            />
            {statusConfig[productState.status]?.label || productState.status}
          </span>
        </td>
        <td className="px-6 py-4 text-center text-sm">{totalStock} шт.</td>
        <td className="px-6 py-4 text-center text-sm font-bold">
          {formattedPrice?.value} RUB
        </td>
        <td className="px-6 py-4 text-right">
          <Link
            href={`/admin/products/${productState.id}/edit`}
            className="text-sm text-indigo-600"
          >
            Ред.
          </Link>
        </td>
      </tr>

      {isDetailsExpanded && <ProductDetailsPanel product={productState} />}

      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="border-l-4 border-indigo-200 bg-indigo-50/30 px-4 py-2">
              <table className="min-w-full">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-1 py-2 text-center">Выбор</th>
                    <th colSpan={2} className="px-6 py-2 text-left">
                      Вариант
                    </th>
                    <th className="px-6 py-2 text-center">Бонусы</th>
                    <th className="px-6 py-2 text-center">Старая цена</th>
                    <th className="px-6 py-2 text-center">Скидка, %</th>
                    <th className="px-6 py-2 text-center">Акция до</th>
                    <th className="px-6 py-2 text-center">Цена</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productState.variants.map((variant) => (
                    <VariantRow
                      key={variant.id}
                      product={productState}
                      variant={variant}
                      isSelected={selectedVariantIds.has(variant.id)}
                      isEdited={false}
                      onSelectOne={handleSelectVariant}
                      onVariantUpdate={handleVariantUpdate}
                      onProductUpdate={handleProductUpdate}
                      allCategories={allCategories}
                      allTags={allTags}
                    />
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
