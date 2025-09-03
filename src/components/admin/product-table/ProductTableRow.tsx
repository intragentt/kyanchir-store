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
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
      clipRule="evenodd"
    />
  </svg>
);
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path
      fillRule="evenodd"
      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      clipRule="evenodd"
    />
  </svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z"
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
  const [isExpanded, setIsExpanded] = useState(false); // Для вариантов
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // Для панели деталей
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set(),
  );
  const [editedVariantIds, setEditedVariantIds] = useState<Set<string>>(
    new Set(),
  );

  // ... (существующие хендлеры без изменений) ...
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

  const rowClassName =
    isExpanded || isDetailsExpanded ? 'bg-indigo-50/50' : 'bg-white';

  return (
    <Fragment>
      {/* === ОСНОВНАЯ СТРОКА ТОВАРА === */}
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

      {/* === ПАНЕЛЬ ДЕТАЛЕЙ (ОПИСАНИЕ И АТРИБУТЫ) === */}
      {isDetailsExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="border-l-4 border-green-200 bg-green-50/30 p-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Левая колонка: Описание */}
                <div>
                  <label
                    htmlFor={`desc-${productState.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Описание
                  </label>
                  <textarea
                    id={`desc-${productState.id}`}
                    rows={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    defaultValue={productState.description || ''}
                    placeholder="Введите описание товара..."
                  />
                  <button className="mt-2 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50">
                    Сохранить описание
                  </button>
                </div>
                {/* Правая колонка: Атрибуты */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Атрибуты
                  </h3>
                  <div className="mt-2 space-y-2">
                    {productState.attributes.map((attr) => (
                      <div key={attr.id} className="flex items-center gap-2">
                        {/* --- НАЧАЛО ИСПРАВЛЕНИЯ: attr.name -> attr.key --- */}
                        <input
                          type="text"
                          defaultValue={attr.key}
                          className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm"
                          placeholder="Название (напр. Состав)"
                        />
                        {/* --- КОНЕЦ ИСПРАВЛЕНИЯ --- */}
                        <input
                          type="text"
                          defaultValue={attr.value}
                          className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm"
                          placeholder="Значение (напр. 100% хлопок)"
                        />
                        <button
                          disabled
                          className="text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button className="w-full rounded-md border-2 border-dashed border-gray-300 bg-white py-1.5 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700">
                      + Добавить атрибут
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* === ПАНЕЛЬ ВАРИАНТОВ (существующая) === */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="border-l-4 border-indigo-200 bg-indigo-50/30 px-4 py-2">
              <table className="min-w-full">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="w-12 px-4 py-2"></th>
                    <th className="px-1 py-2 text-left">Размер / Название</th>
                    <th className="px-2 py-2 text-center">Склад</th>
                    <th className="px-2 py-2 text-center">Корзина 24ч</th>
                    <th className="px-2 py-2 text-center">Избранное</th>
                    <th className="px-2 py-2 text-center">Акция до</th>
                    <th className="px-2 py-2 text-center">Старая Цена</th>
                    <th className="px-2 py-2 text-center">Скидка, %</th>
                    <th className="px-2 py-2 text-center">Цена</th>
                    <th className="px-2 py-2 text-center">Действия</th>
                  </tr>
                </thead>
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
                  <tr>
                    <td colSpan={10} className="py-2 pl-16 text-left">
                      <button className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                        + Добавить вариант
                      </button>
                    </td>
                  </tr>
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
  const discountPercent =
    variant.oldPrice && variant.price < variant.oldPrice
      ? Math.round(
          ((variant.oldPrice - variant.price) / variant.oldPrice) * 100,
        )
      : 0;

  const hasSameDescriptionAsProduct = true; // Заглушка

  return (
    <tr className="text-sm hover:bg-gray-100/50">
      <td className="w-12 px-4 py-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={isSelected}
          onChange={(e) => onSelectOne(variant.id, e.target.checked)}
        />
      </td>
      <td className="px-1 py-2 text-left">
        <div className="flex items-center gap-2">
          <Image
            src={variant.images[0]?.url || '/placeholder.png'}
            alt="Фото 1"
            width={36}
            height={48}
            className="h-12 w-9 rounded-sm object-cover"
          />
          <Image
            src={variant.images[1]?.url || '/placeholder.png'}
            alt="Фото 2"
            width={36}
            height={48}
            className="h-12 w-9 rounded-sm object-cover"
          />
          <div>
            <span className="font-medium text-gray-800">
              {variant.inventory.map((inv) => inv.size.value).join(', ')}
            </span>
            {hasSameDescriptionAsProduct && (
              <div className="cursor-pointer text-xs text-indigo-500 hover:underline">
                (изменить описание)
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        {variant.inventory.map((inv) => (
          <div key={inv.id}>
            <input
              type="number"
              defaultValue={inv.stock}
              className="w-12 rounded-md border-gray-300 p-1 text-center shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        ))}
      </td>
      <td className="px-2 py-2 text-center text-gray-500">0</td>
      <td className="px-2 py-2 text-center text-gray-500">0</td>
      <td className="px-2 py-2 text-center">
        {discountPercent > 0 && (
          <div className="flex items-center justify-center gap-1 text-xs text-orange-600">
            <ClockIcon className="h-4 w-4" />
            <span>1д 4ч</span>
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-center text-gray-500">
        {variant.oldPrice ? `${formatPrice(variant.oldPrice)?.value} RUB` : '—'}
      </td>
      <td className="px-2 py-2 text-center font-medium text-green-600">
        {discountPercent > 0 ? `${discountPercent}%` : '—'}
      </td>
      <td className="px-2 py-2 text-center font-bold text-gray-900">
        {formatPrice(variant.price)?.value} RUB
      </td>
      <td className="px-2 py-2 text-center">
        <button
          disabled
          className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
};
