// Местоположение: /src/components/admin/product-table/VariantRow.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Prisma, Category, Tag } from '@prisma/client';

import { ProductForTable } from '@/app/admin/dashboard/page';
import { EditableCountdownTimer } from './EditableCountdownTimer';
// --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПРАВЛЕН ПУТЬ ИМПОРТА ---
import { TrashIcon } from '@/components/icons/TrashIcon';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

// --- ТИПЫ И ХЕЛПЕРЫ ---
type VariantData = ProductForTable['variants'][0];
type ProductData = Omit<ProductForTable, 'variants'>;

const formatNumberForInput = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '';
  return num.toString();
};

// --- PROPS КОМПОНЕНТА ---
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

export function VariantRow({
  product,
  variant: initialVariant,
  isSelected,
  isEdited,
  onSelectOne,
  onVariantUpdate,
  onProductUpdate,
  allCategories,
  allTags,
}: VariantRowProps) {
  const [variant, setVariant] = useState(initialVariant);
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);

  useEffect(() => {
    setVariant(initialVariant);
  }, [initialVariant]);

  const handleLocalUpdateAndNotify = (updatedData: Partial<VariantData>) => {
    setVariant((prev) => ({ ...prev, ...updatedData }));
    onVariantUpdate(variant.id, updatedData);
  };

  const handleNumericInputChange = (
    field: keyof VariantData,
    inputValue: string,
  ) => {
    const numericString = inputValue.replace(/[^0-9]/g, '');
    const value = numericString === '' ? null : parseInt(numericString, 10);
    handleLocalUpdateAndNotify({ [field]: value });
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
      updatedData = {
        price: originalPrice,
        oldPrice: null,
      };
    }
    handleLocalUpdateAndNotify(updatedData);
  };

  const discountPercent =
    variant.oldPrice && variant.price < variant.oldPrice
      ? Math.round(
          ((variant.oldPrice - variant.price) / variant.oldPrice) * 100,
        )
      : 0;

  const rowClassName = isEdited
    ? 'bg-yellow-100/50'
    : product.status === 'PUBLISHED'
      ? 'bg-green-100/30'
      : 'bg-gray-100/30';

  return (
    <tr className={rowClassName}>
      <td className="w-12 px-1 py-3 text-center">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={isSelected}
          onChange={(e) => onSelectOne(variant.id, e.target.checked)}
        />
      </td>
      <td colSpan={2} className="px-6 py-3">
        <div className="flex items-center">
          <div className="grid h-12 w-24 flex-shrink-0 grid-cols-2 gap-1">
            <div className="relative aspect-[3/4]">
              <Image
                src={variant.images[0]?.url || '/placeholder.png'}
                alt={`${product.name} ${variant.color || ''} фото 1`}
                fill
                className="rounded-md object-cover"
              />
            </div>
            <div className="relative aspect-[3/4]">
              <Image
                src={variant.images[1]?.url || '/placeholder.png'}
                alt={`${product.name} ${variant.color || ''} фото 2`}
                fill
                className="rounded-md object-cover"
              />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold">
              {variant.color || 'Базовый'}
            </div>
            <div className="mt-1 flex gap-x-1">
              {variant.inventory.map((inv) => (
                <div
                  key={inv.id}
                  className="inline-flex items-center rounded bg-gray-200/50 px-1.5"
                >
                  <span className="font-mono text-xs">{inv.size.value}:</span>
                  <input
                    type="number"
                    defaultValue={inv.stock}
                    className="w-8 border-none bg-transparent p-0 text-center text-xs font-semibold"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-3 text-center">
        <input
          type="text"
          value={formatNumberForInput(variant.bonusPoints)}
          onChange={(e) =>
            handleNumericInputChange('bonusPoints', e.target.value)
          }
          className="w-20 rounded-md border-gray-300 p-1 text-center text-sm"
        />
      </td>
      <td className="px-6 py-3 text-center">
        <input
          type="text"
          placeholder="-"
          value={formatNumberForInput(variant.oldPrice)}
          onChange={(e) => handleNumericInputChange('oldPrice', e.target.value)}
          className="w-24 rounded-md border-gray-300 p-1 text-center text-sm text-gray-500 line-through"
        />
      </td>
      <td className="px-6 py-3 text-center">
        <div className="inline-flex items-center">
          <input
            type="text"
            value={editingDiscount ?? discountPercent}
            onChange={(e) => setEditingDiscount(e.target.value)}
            onFocus={() => setEditingDiscount(String(discountPercent))}
            onBlur={() => {
              if (editingDiscount !== null)
                handleDiscountChange(editingDiscount);
              setEditingDiscount(null);
            }}
            className="w-16 rounded-md border-gray-300 p-1 text-center text-sm"
          />
          <span className="ml-1 font-semibold text-gray-600">%</span>
        </div>
      </td>
      <td className="px-6 py-3 text-center">
        <EditableCountdownTimer
          variant={variant}
          hasDiscount={!!variant.oldPrice}
          onUpdate={(field, value) =>
            handleLocalUpdateAndNotify({ [field]: value })
          }
        />
      </td>
      <td className="px-6 py-3 text-center">
        <input
          type="text"
          value={formatNumberForInput(variant.price)}
          onChange={(e) => handleNumericInputChange('price', e.target.value)}
          className="w-24 rounded-md border-gray-300 p-1 text-center text-sm font-bold"
        />
      </td>
      <td className="px-6 py-3 text-center">
        <button
          disabled
          className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}
