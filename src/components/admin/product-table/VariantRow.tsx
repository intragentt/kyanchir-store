// Местоположение: /src/components/admin/product-table/VariantRow.tsx
'use client';

import { useState, Fragment, useCallback } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Prisma } from '@prisma/client';

import { ExpanderCell } from './ExpanderCell';
import { ProductSizeRow } from './ProductSizeRow';

type VariantWithDetails = Prisma.ProductVariantGetPayload<{
  include: {
    images: true;
    sizes: {
      include: {
        size: true;
      };
      select: {
        id: true;
        stock: true;
        size: true;
        moySkladHref: true;
        moySkladType: true;
        price: true;
        oldPrice: true;
        code: true;
      };
    };
  };
}>;

const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast.success('Артикул скопирован!');
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, []);
  return { isCopied, copy };
};

const getColorCode = (color: string) => {
  const colorMap: { [key: string]: string } = {
    белый: 'WHT',
    красный: 'RED',
    розовый: 'PNK',
    черный: 'BLK',
    синий: 'BLU',
    зеленый: 'GRN',
  };
  const lowerColor = color.toLowerCase().split(' / ')[0];
  return colorMap[lowerColor] || color.substring(0, 3).toUpperCase();
};

const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '0 RUB';
  const priceInRubles = priceInCents / 100;
  return `${new Intl.NumberFormat('ru-RU').format(priceInRubles)} RUB`;
};

// --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем пропсы ---
interface VariantRowProps {
  variant: VariantWithDetails;
  parentProductArticle: string;
  isEditMode: boolean; // <-- Добавляем
}

export function VariantRow({
  variant,
  parentProductArticle,
  isEditMode, // <-- Принимаем
}: VariantRowProps) {
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  const [isExpanded, setIsExpanded] = useState(false);
  const { isCopied, copy } = useCopyToClipboard();

  const totalStock = variant.sizes.reduce((sum, size) => sum + size.stock, 0);
  const totalSalePrice = variant.sizes.reduce(
    (sum, size) => sum + (size.price ?? variant.price ?? 0) * size.stock,
    0,
  );
  const totalOldPrice = variant.sizes.reduce((sum, size) => {
    const priceToUse = size.price ?? variant.price ?? 0;
    const oldPriceToUse = size.oldPrice ?? variant.oldPrice ?? 0;
    const finalPrice = oldPriceToUse > priceToUse ? oldPriceToUse : priceToUse;
    return sum + finalPrice * size.stock;
  }, 0);

  const variantArticle = `${parentProductArticle}-${getColorCode(variant.color || '')}`;

  return (
    <Fragment>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer bg-white hover:bg-gray-50"
      >
        <ExpanderCell
          count={variant.sizes.length}
          isExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          level={2}
        />

        <td className="w-12 px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>

        <td className="whitespace-nowrap px-6 py-2">
          <div className="flex items-center">
            <Image
              src={variant.images[0]?.url || '/placeholder.png'}
              alt={variant.color || 'variant'}
              width={32}
              height={40}
              className="h-10 w-8 rounded object-cover"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-800">
                {variant.color || 'Основной'}
              </div>
            </div>
          </div>
        </td>

        <td className="px-6 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-700">{variantArticle}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copy(variantArticle);
              }}
              className="text-gray-400 hover:text-indigo-600"
              title="Скопировать артикул"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </td>

        <td className="w-40 px-6 py-2 text-center text-sm">0 шт.</td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm text-gray-600">
          {totalStock} шт.
        </td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm text-gray-500">
          {formatPrice(totalOldPrice)}
        </td>
        <td className="w-40 whitespace-nowrap px-6 py-2 text-center text-sm font-bold text-gray-800">
          {formatPrice(totalSalePrice)}
        </td>
        <td className="w-[112px]"></td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="w-12 pl-8"></th>
                  <th className="w-12 px-2 py-2"></th>
                  <th className="px-6 py-2 text-left">Размер</th>
                  <th className="px-6 py-2 text-left">Артикул</th>
                  <th className="w-32 px-6 py-2 text-center">Бронь</th>
                  <th className="w-32 px-6 py-2 text-center">Склад</th>
                  <th className="w-32 px-6 py-2 text-center">Цена</th>
                  <th className="w-32 px-6 py-2 text-center">Скидка %</th>
                  <th className="w-32 px-6 py-2 text-center">Итого/шт</th>
                  <th className="w-32 px-6 py-2 text-center">Сумма</th>
                  <th className="w-24 px-6 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variant.sizes.map((sizeInfo) => (
                  <ProductSizeRow
                    key={sizeInfo.id}
                    sizeInfo={sizeInfo as any}
                    variantPrice={variant.price}
                    variantOldPrice={variant.oldPrice}
                    variantArticle={variantArticle}
                    isEditMode={isEditMode} // <-- Передаем сигнал дальше
                  />
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
