// Местоположение: /src/components/admin/product-table/ProductSizeRow.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import toast from 'react-hot-toast';

import { PencilIcon } from '@/components/icons/PencilIcon';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { XMarkIcon } from '@/components/icons/XMarkIcon';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';

const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '—';
  const priceInRubles = priceInCents / 100;
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(priceInRubles)} RUB`;
};

type SizeInfo = Prisma.ProductSizeGetPayload<{
  include: { size: true };
}> & {
  moySkladHref: string | null;
  moySkladType: string;
  price: number | null;
  oldPrice: number | null;
};

interface ProductSizeRowProps {
  sizeInfo: SizeInfo;
  variantPrice: number | null;
  variantOldPrice: number | null;
}

export function ProductSizeRow({
  sizeInfo,
  variantPrice,
  variantOldPrice,
}: ProductSizeRowProps) {
  const router = useRouter();

  // --- ЛОГИКА ОТОБРАЖЕНИЯ ЦЕН ---
  const resolvedPrice = sizeInfo.price ?? variantPrice;
  const resolvedOldPrice = sizeInfo.oldPrice ?? variantOldPrice;
  const priceForDisplay = resolvedPrice;

  // --- НАЧАЛО ИСПРАВЛЕНИЯ ---
  const oldPriceForDisplay =
    resolvedPrice !== null &&
    resolvedOldPrice !== null &&
    resolvedOldPrice > resolvedPrice
      ? resolvedOldPrice
      : resolvedPrice;
  // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

  // --- СОСТОЯНИЯ КОМПОНЕНТА ---
  const [isStockEditing, setIsStockEditing] = useState(false);
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [stockValue, setStockValue] = useState(String(sizeInfo.stock));

  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceValue, setPriceValue] = useState(
    String(priceForDisplay ? priceForDisplay / 100 : ''),
  );
  const [oldPriceValue, setOldPriceValue] = useState(
    String(oldPriceForDisplay ? oldPriceForDisplay / 100 : ''),
  );
  const [lastEditedField, setLastEditedField] = useState<
    'price' | 'oldPrice' | null
  >(null);

  const totalValue = (priceForDisplay || 0) * sizeInfo.stock;

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
  const handlePriceSave = async () => {
    if (!sizeInfo.moySkladHref) {
      toast.error('Ошибка: Href размера из МойСклад не найден.');
      return;
    }

    const newPriceParsed = parseFloat(priceValue.replace(',', '.'));
    const newOldPriceParsed = parseFloat(oldPriceValue.replace(',', '.'));

    if (isNaN(newPriceParsed) || isNaN(newOldPriceParsed)) {
      toast.error('Введите корректные числовые значения для цен.');
      return;
    }

    setIsPriceLoading(true);

    let finalPrice = Math.round(newPriceParsed * 100);
    let finalOldPrice = Math.round(newOldPriceParsed * 100);

    const originalPriceForLogic = priceForDisplay || 0;
    const originalOldPriceForLogic = oldPriceForDisplay || 0;

    if (lastEditedField === 'price') {
      if (finalPrice < originalOldPriceForLogic) {
        finalOldPrice = originalOldPriceForLogic;
      } else {
        finalOldPrice = finalPrice;
      }
    } else if (lastEditedField === 'oldPrice') {
      if (finalOldPrice > originalPriceForLogic) {
        finalPrice = originalPriceForLogic;
      } else {
        finalPrice = finalOldPrice;
      }
    } else {
      if (finalPrice >= finalOldPrice) {
        finalOldPrice = finalPrice;
      }
    }

    const promise = fetch('/api/admin/products/update-size-price', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moySkladHref: sizeInfo.moySkladHref,
        productSizeId: sizeInfo.id,
        newPrice: finalPrice,
        newOldPrice: finalOldPrice,
      }),
    });

    toast.promise(promise, {
      loading: 'Обновляем цены...',
      success: (res) => {
        if (!res.ok) throw new Error('Ошибка.');
        router.refresh();
        setIsPriceEditing(false);
        setLastEditedField(null);
        return 'Цены успешно обновлены!';
      },
      error: 'Не удалось обновить цены.',
    });

    try {
      await promise;
    } catch (error) {
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handlePriceCancel = () => {
    setPriceValue(String(priceForDisplay ? priceForDisplay / 100 : ''));
    setOldPriceValue(
      String(oldPriceForDisplay ? oldPriceForDisplay / 100 : ''),
    );
    setIsPriceEditing(false);
    setLastEditedField(null);
  };

  const handleStockSave = async () => {
    const newStock = parseInt(stockValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Введите корректное число.');
      return;
    }
    if (newStock === sizeInfo.stock) {
      setIsStockEditing(false);
      return;
    }
    if (!sizeInfo.moySkladHref) {
      toast.error('Ошибка: Href размера из МойСклад не найден.');
      return;
    }
    setIsStockLoading(true);
    const promise = fetch('/api/admin/products/update-stock', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moySkladHref: sizeInfo.moySkladHref,
        moySkladType: sizeInfo.moySkladType,
        newStock: newStock,
        oldStock: sizeInfo.stock,
        productSizeId: sizeInfo.id,
      }),
    });
    toast.promise(promise, {
      loading: 'Обновляем остатки...',
      success: (res) => {
        if (!res.ok) throw new Error('Ошибка.');
        router.refresh();
        setIsStockEditing(false);
        return 'Остатки успешно обновлены!';
      },
      error: 'Не удалось обновить остатки.',
    });
    try {
      await promise;
    } catch (error) {
    } finally {
      setIsStockLoading(false);
    }
  };

  const handleStockCancel = () => {
    setStockValue(String(sizeInfo.stock));
    setIsStockEditing(false);
  };

  // --- JSX РАЗМЕТКА ---
  return (
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      <td className="w-24 px-4 py-1"></td>
      <td className="whitespace-nowrap px-6 py-1 text-sm text-gray-700">
        {sizeInfo.size.value}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        0 шт.
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {isStockEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              className="w-16 rounded-md border-gray-300 text-center shadow-sm"
              disabled={isStockLoading}
              autoFocus
            />
            <button
              onClick={handleStockSave}
              disabled={isStockLoading}
              className="text-green-600 hover:text-green-800 disabled:text-gray-400"
            >
              {isStockLoading ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handleStockCancel}
              disabled={isStockLoading}
              className="text-red-500 hover:text-red-700 disabled:text-gray-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div
            className="group relative flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsStockEditing(true)}
          >
            <span>{sizeInfo.stock} шт.</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {isPriceEditing ? (
          <input
            type="text"
            value={oldPriceValue}
            onChange={(e) => {
              setOldPriceValue(e.target.value);
              setLastEditedField('oldPrice');
            }}
            className="w-24 rounded-md border-gray-300 text-center shadow-sm"
            disabled={isPriceLoading}
          />
        ) : (
          <div
            className="group relative flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsPriceEditing(true)}
          >
            <span>{formatPrice(oldPriceForDisplay)}</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm font-medium text-gray-800">
        {isPriceEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              value={priceValue}
              onChange={(e) => {
                setPriceValue(e.target.value);
                setLastEditedField('price');
              }}
              className="w-24 rounded-md border-gray-300 text-center shadow-sm"
              disabled={isPriceLoading}
              autoFocus
            />
            <button
              onClick={handlePriceSave}
              disabled={isPriceLoading}
              className="text-green-600 hover:text-green-800 disabled:text-gray-400"
            >
              {isPriceLoading ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handlePriceCancel}
              disabled={isPriceLoading}
              className="text-red-500 hover:text-red-700 disabled:text-gray-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div
            className="group relative flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsPriceEditing(true)}
          >
            <span>{formatPrice(priceForDisplay)}</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-right text-sm font-bold text-gray-900">
        {formatPrice(totalValue)}
      </td>
      <td className="w-24 px-6 py-1"></td>
    </tr>
  );
}
