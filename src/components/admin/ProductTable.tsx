// Местоположение: src/components/admin/ProductTable.tsx
'use client'; // <--- ДОБАВЛЕНО ЭТО ИЗМЕНЕНИЕ

import { useState } from 'react';
import Link from 'next/link';
import type { VariantWithProductInfo } from '@/app/admin/dashboard/page';
import type { Prisma, Category, Tag } from '@prisma/client';
import { ProductTableRow } from './product-table/ProductTableRow';

type ProductStatus = Prisma.ProductGetPayload<{}>['status'];

const statusCycle: ProductStatus[] = ['DRAFT', 'PUBLISHED'];

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M5.5 16a3.5 3.5 0 01-3.5-3.5V5.5A3.5 3.5 0 015.5 2h5.086a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V12.5A3.5 3.5 0 0112.5 16h-7zM5 5.5A1.5 1.5 0 003.5 7v5.5A1.5 1.5 0 005 14h7.5a1.5 1.5 0 001.5-1.5V8.586L8.586 4H5.5A1.5 1.5 0 005 5.5z" />
    <path d="M7 8a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

interface ProductTableProps {
  variants: VariantWithProductInfo[];
  allCategories: Category[];
  allTags: Tag[];
}

export default function ProductTable({
  variants: initialVariants,
  allCategories,
  allTags,
}: ProductTableProps) {
  const [variants, setVariants] = useState(initialVariants);
  const [editedVariantIds, setEditedVariantIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleNumericInputChange = (
    variantId: string,
    field: keyof VariantWithProductInfo,
    inputValue: string,
  ) => {
    const numericString = inputValue.replace(/[^0-9]/g, '');
    const value = numericString === '' ? null : parseInt(numericString, 10);
    handleVariantChange(variantId, field, value);
  };

  const handleVariantChange = (
    variantId: string,
    field: keyof VariantWithProductInfo,
    value: any,
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)),
    );
    setEditedVariantIds((prev) => new Set(prev).add(variantId));
  };

  const handleInventoryChange = (
    variantId: string,
    inventoryId: string,
    inputValue: string,
  ) => {
    const numericString = inputValue.replace(/[^0-9]/g, '');
    const newStock = numericString === '' ? 0 : parseInt(numericString, 10);

    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const updatedVariant = JSON.parse(JSON.stringify(v));
          const inventoryItem = updatedVariant.product.variants
            .flatMap((pv: any) => pv.inventory)
            .find((inv: any) => inv.id === inventoryId);

          if (inventoryItem) {
            inventoryItem.stock = newStock;
          }
          return updatedVariant;
        }
        return v;
      }),
    );

    setEditedVariantIds((prev) => new Set(prev).add(variantId));
  };

  const handleCategoryChange = (
    productId: string,
    newCategories: Category[],
  ) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.product.id === productId) {
          const updatedVariant = JSON.parse(JSON.stringify(v));
          updatedVariant.product.categories = newCategories;
          return updatedVariant;
        }
        return v;
      }),
    );

    const variantsToUpdate = variants.filter((v) => v.product.id === productId);
    setEditedVariantIds(
      (prev) => new Set([...prev, ...variantsToUpdate.map((v) => v.id)]),
    );
  };

  const handleTagsChange = (productId: string, selectedTagIds: string[]) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.product.id === productId) {
          const newTags = allTags.filter((t) => selectedTagIds.includes(t.id));
          const updatedVariant = JSON.parse(JSON.stringify(v));
          updatedVariant.product.tags = newTags;
          return updatedVariant;
        }
        return v;
      }),
    );
    const variantsToUpdate = variants.filter((v) => v.product.id === productId);
    setEditedVariantIds(
      (prev) => new Set([...prev, ...variantsToUpdate.map((v) => v.id)]),
    );
  };

  const handleDiscountChange = (
    variant: VariantWithProductInfo,
    newPercentStr: string,
  ) => {
    const newPercent = newPercentStr ? parseInt(newPercentStr, 10) : 0;
    if (isNaN(newPercent) || newPercent < 0 || newPercent > 100) return;

    const discountTag = allTags.find((t) => t.name.toLowerCase() === 'скидка');

    setVariants((prev) => {
      const variantsWithPriceChange = prev.map((v) => {
        if (v.id === variant.id) {
          const originalPrice = v.oldPrice || v.price;
          if (newPercent > 0) {
            return {
              ...v,
              price: Math.round(originalPrice * (1 - newPercent / 100)),
              oldPrice: originalPrice,
            };
          } else {
            return { ...v, price: originalPrice, oldPrice: null };
          }
        }
        return v;
      });

      const anyVariantHasDiscount = variantsWithPriceChange
        .filter((v) => v.product.id === variant.product.id)
        .some((v) => v.oldPrice !== null);

      return variantsWithPriceChange.map((v) => {
        if (v.product.id === variant.product.id) {
          if (!discountTag) return v;

          const currentTags = v.product.tags || [];
          const hasDiscountTag = currentTags.some(
            (t) => t.id === discountTag.id,
          );

          let newTags = currentTags;
          if (anyVariantHasDiscount && !hasDiscountTag) {
            newTags = [...currentTags, discountTag];
          } else if (!anyVariantHasDiscount && hasDiscountTag) {
            newTags = currentTags.filter((t) => t.id !== discountTag.id);
          }

          return { ...v, product: { ...v.product, tags: newTags } };
        }
        return v;
      });
    });

    const variantsToUpdate = variants.filter(
      (v) => v.product.id === variant.product.id,
    );
    setEditedVariantIds(
      (prev) => new Set([...prev, ...variantsToUpdate.map((v) => v.id)]),
    );
  };

  const handleProductStatusChange = (
    productId: string,
    newStatus: ProductStatus,
  ) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.product.id === productId) {
          const updatedVariant = JSON.parse(JSON.stringify(v));
          updatedVariant.product.status = newStatus;
          return updatedVariant;
        }
        return v;
      }),
    );

    const variantsToUpdate = variants.filter((v) => v.product.id === productId);
    setEditedVariantIds(
      (prev) => new Set([...prev, ...variantsToUpdate.map((v) => v.id)]),
    );
  };

  const handleStatusToggle = (
    currentStatus: ProductStatus,
    productId: string,
  ) => {
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    const newStatus = statusCycle[nextIndex];
    handleProductStatusChange(productId, newStatus);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVariantIds(new Set(variants.map((v) => v.id)));
    } else {
      setSelectedVariantIds(new Set());
    }
  };

  const handleSelectOne = (variantId: string, isSelected: boolean) => {
    setSelectedVariantIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(variantId);
      } else {
        newSet.delete(variantId);
      }
      return newSet;
    });
  };

  const handleCopy = (id: string) => navigator.clipboard.writeText(id);

  const handleSave = async () => {
    if (editedVariantIds.size === 0 || isSaving) return;

    setIsSaving(true);
    const variantsToUpdate = variants.filter((v) => editedVariantIds.has(v.id));

    try {
      const response = await fetch('/api/variants/batch-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variants: variantsToUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при сохранении данных');
      }

      setEditedVariantIds(new Set());
      alert('Изменения успешно сохранены!');
    } catch (error) {
      console.error('Failed to save variants:', error);
      // @ts-ignore
      alert(`Не удалось сохранить изменения: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <UploadIcon className="h-4 w-4" /> Загрузить CSV
          </button>
          <button className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <DownloadIcon className="h-4 w-4" /> Выгрузить CSV
          </button>
          <Link
            href="/admin/categories"
            className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <TagIcon className="h-4 w-4" /> Управление категориями
          </Link>
          {editedVariantIds.size > 0 && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSaving
                ? 'Сохранение...'
                : `Сохранить (${editedVariantIds.size})`}
            </button>
          )}
        </div>
        <Link
          href="/admin/products/new"
          className="hover:bg-opacity-80 rounded-md bg-[#272727] px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          + Создать товар
        </Link>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full pl-12 align-middle">
          <div className="overflow-hidden border-b border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative px-6 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      onChange={handleSelectAll}
                      checked={
                        selectedVariantIds.size === variants.length &&
                        variants.length > 0
                      }
                      ref={(input) => {
                        if (input) {
                          input.indeterminate =
                            selectedVariantIds.size > 0 &&
                            selectedVariantIds.size < variants.length;
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Категории
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Товар / Арт. / Ост.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                    K-коины
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Цена до скидки
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Скидка
                  </th>
                  <th className="w-28 px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Таймер
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Цена
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, variantIdx) => (
                  <ProductTableRow
                    key={variant.id}
                    variant={variant}
                    variantIdx={variantIdx}
                    isSelected={selectedVariantIds.has(variant.id)}
                    isEdited={editedVariantIds.has(variant.id)}
                    allCategories={allCategories}
                    allTags={allTags}
                    onSelectOne={handleSelectOne}
                    onCopy={handleCopy}
                    onStatusToggle={handleStatusToggle}
                    onNumericInputChange={handleNumericInputChange}
                    onDiscountChange={handleDiscountChange}
                    onVariantChange={handleVariantChange}
                    onInventoryChange={handleInventoryChange}
                    onCategoryChange={handleCategoryChange}
                    onTagsChange={handleTagsChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
