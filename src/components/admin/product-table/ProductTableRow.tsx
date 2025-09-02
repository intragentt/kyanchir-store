// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Prisma, Category, Tag } from '@prisma/client';

import { formatPrice } from '@/utils/formatPrice';
import type { ProductForTable } from '@/app/admin/dashboard/page';
import { EditableCountdownTimer } from './EditableCountdownTimer';
import ShortLogo from '@/components/icons/ShortLogo';

// --- ИКОНКИ И ТИПЫ ---
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

type ProductStatus = ProductForTable['status'];
const statusConfig: Record<
  ProductStatus,
  { dotClassName: string; label: string }
> = {
  DRAFT: { dotClassName: 'bg-yellow-400', label: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', label: 'Опубликован' },
  ARCHIVED: { dotClassName: 'bg-gray-400', label: 'В архиве' },
};
type VariantData = ProductForTable['variants'][0];
type ProductData = Omit<ProductForTable, 'variants'>;

const formatNumberForInput = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '';
  return num.toString();
};

// =====================================================================
// === ГЛАВНЫЙ КОМПОНЕНТ: КОНТЕЙНЕР ДЛЯ ПРОДУКТА (PRODUCTTABLEROW) ===
// =====================================================================

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
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set(),
  );
  const [editedVariantIds, setEditedVariantIds] = useState<Set<string>>(
    new Set(),
  );

  const handleVariantUpdate = (
    variantId: string,
    updatedData: Partial<VariantData>,
  ) => {
    setProductState((prevState) => ({
      ...prevState,
      variants: prevState.variants.map((v) =>
        v.id === variantId ? { ...v, ...updatedData } : v,
      ),
    }));
    setEditedVariantIds((prev) => new Set(prev).add(variantId));
  };

  const handleProductUpdate = (
    productId: string,
    updatedData: Partial<ProductData>,
  ) => {
    setProductState((prevState) => ({ ...prevState, ...updatedData }));
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

  return (
    <Fragment>
      <tr className="border-t bg-white hover:bg-gray-50">
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
          {productState.variants.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-md p-1 hover:bg-gray-100"
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

      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-gray-50/50 p-0">
            <div className="border-l-4 border-indigo-200 px-4 py-2">
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-200">
                  {productState.variants.map((variant) => (
                    <VariantRow
                      key={variant.id}
                      product={productState}
                      variant={variant}
                      allCategories={allCategories}
                      allTags={allTags}
                      isSelected={selectedVariantIds.has(variant.id)}
                      isEdited={editedVariantIds.has(variant.id)}
                      onSelectOne={handleSelectVariant}
                      onVariantUpdate={handleVariantUpdate}
                      onProductUpdate={handleProductUpdate}
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

// ==========================================================
// === ДОЧЕРНИЙ КОМПОНЕНТ: РЕДАКТИРУЕМАЯ СТРОКА ВАРИАНТА ===
// ==========================================================
interface VariantRowProps {
  product: ProductData;
  variant: VariantData;
  isSelected: boolean;
  isEdited: boolean;
  onSelectOne: (variantId: string, isSelected: boolean) => void;
  onVariantUpdate: (
    variantId: string,
    updatedData: Partial<VariantData>,
  ) => void;
  onProductUpdate: (
    productId: string,
    updatedData: Partial<ProductData>,
  ) => void;
  allCategories: Category[];
  allTags: Tag[];
}

const VariantRow = ({
  variant,
  isSelected,
  onSelectOne,
  onVariantUpdate,
}: VariantRowProps) => {
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);

  const discountPercent =
    variant.oldPrice && variant.price < variant.oldPrice
      ? Math.round(
          ((variant.oldPrice - variant.price) / variant.oldPrice) * 100,
        )
      : 0;

  const handleNumericInputChange = (
    field: keyof VariantData,
    inputValue: string,
  ) => {
    const numericString = inputValue.replace(/[^0-9]/g, '');
    const value = numericString === '' ? null : parseInt(numericString, 10);
    onVariantUpdate(variant.id, { [field]: value });
  };

  const handleDiscountChange = (newPercentStr: string) => {
    const newPercent = newPercentStr ? parseInt(newPercentStr, 10) : 0;
    if (isNaN(newPercent) || newPercent < 0 || newPercent > 100) return;

    const originalPrice = variant.oldPrice || variant.price;
    if (!originalPrice) return;
    let updatedData: Partial<VariantData>;
    if (newPercent > 0) {
      updatedData = {
        price: Math.round(originalPrice * (1 - newPercent / 100)),
        oldPrice: originalPrice,
      };
    } else {
      updatedData = { price: originalPrice, oldPrice: null };
    }
    onVariantUpdate(variant.id, updatedData);
  };

  return (
    <tr className="hover:bg-gray-100/50">
      <td className="w-24 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={isSelected}
          onChange={(e) => onSelectOne(variant.id, e.target.checked)}
        />
      </td>
      <td className="px-6 py-3"> {/* Пусто */} </td>
      <td className="px-6 py-3">(категории)</td>
      <td className="px-6 py-3">(статус)</td>
      <td className="px-6 py-3 text-center">
        {variant.inventory.map((inv) => (
          <div key={inv.id}>
            {inv.size.value}:{' '}
            <input
              type="number"
              defaultValue={inv.stock}
              className="w-10 p-0.5 text-center"
            />
          </div>
        ))}
      </td>
      <td className="px-6 py-3 text-center">
        {formatPrice(variant.price)?.value} RUB
      </td>
      <td className="px-6 py-3"></td>
    </tr>
  );
};
