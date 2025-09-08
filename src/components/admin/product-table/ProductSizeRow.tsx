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
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles);
};

const calculateDiscount = (oldPrice: number | null, price: number | null) => {
  if (oldPrice && price && oldPrice > price) {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }
  return 0;
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

  const resolvedPrice = sizeInfo.price ?? variantPrice;
  const resolvedOldPrice = sizeInfo.oldPrice ?? variantOldPrice;
  const priceForDisplay = resolvedPrice;
  const oldPriceForDisplay =
    resolvedPrice !== null &&
    resolvedOldPrice !== null &&
    resolvedOldPrice > resolvedPrice
      ? resolvedOldPrice
      : resolvedPrice;
  const discountForDisplay = calculateDiscount(
    oldPriceForDisplay,
    priceForDisplay,
  );

  const [isStockEditing, setIsStockEditing] = useState(false);
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [stockValue, setStockValue] = useState(String(sizeInfo.stock));

  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  const [priceValue, setPriceValue] = useState(
    priceForDisplay ? (priceForDisplay / 100).toString() : '',
  );
  const [oldPriceValue, setOldPriceValue] = useState(
    oldPriceForDisplay ? (oldPriceForDisplay / 100).toString() : '',
  );
  const [discountValue, setDiscountValue] = useState(
    String(discountForDisplay),
  );

  const totalValue = (priceForDisplay || 0) * sizeInfo.stock;

  const handleOldPriceChange = (value: string) => {
    setOldPriceValue(value);
    const oldP = parseFloat(value.replace(',', '.')) || 0;
    const currentP = parseFloat(priceValue.replace(',', '.')) || 0;
    const newDiscount = calculateDiscount(oldP * 100, currentP * 100);
    setDiscountValue(String(newDiscount));
  };

  const handleDiscountChange = (value: string) => {
    setDiscountValue(value);
    const discount = parseFloat(value) || 0;
    const oldP = parseFloat(oldPriceValue.replace(',', '.')) || 0;
    const newPrice = oldP * (1 - discount / 100);
    setPriceValue(newPrice.toFixed(2));
  };

  const handlePriceChange = (value: string) => {
    setPriceValue(value);
    const newP = parseFloat(value.replace(',', '.')) || 0;
    const oldP = parseFloat(oldPriceValue.replace(',', '.')) || 0;
    const newDiscount = calculateDiscount(oldP * 100, newP * 100);
    setDiscountValue(String(newDiscount));
  };

  const handlePriceSave = async () => {
    if (!sizeInfo.moySkladHref) {
      toast.error('Ошибка: Href размера из МойСклад не найден.');
      return;
    }
    let newPrice = parseFloat(priceValue.replace(',', '.'));
    let newOldPrice = parseFloat(oldPriceValue.replace(',', '.'));
    if (isNaN(newPrice) || isNaN(newOldPrice)) {
      toast.error('Введите корректные числовые значения для цен.');
      return;
    }
    setIsPriceLoading(true);
    if (newPrice > newOldPrice) {
      newOldPrice = newPrice;
    }
    const promise = fetch('/api/admin/products/update-size-price', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moySkladHref: sizeInfo.moySkladHref,
        productSizeId: sizeInfo.id,
        newPrice: Math.round(newPrice * 100),
        newOldPrice: Math.round(newOldPrice * 100),
      }),
    });
    toast.promise(promise, {
      loading: 'Обновляем цены...',
      success: (res) => {
        if (!res.ok) throw new Error('Ошибка.');
        router.refresh();
        setIsPriceEditing(false);
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
    setPriceValue(priceForDisplay ? (priceForDisplay / 100).toString() : '');
    setOldPriceValue(
      oldPriceForDisplay ? (oldPriceForDisplay / 100).toString() : '',
    );
    setDiscountValue(String(discountForDisplay));
    setIsPriceEditing(false);
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

  const inputClassName =
    'bg-transparent border-0 border-b border-indigo-400 p-0 text-center text-sm focus:ring-0';

  return (
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      <td className="w-24 px-4 py-1"></td>
      <td className="whitespace-nowrap px-6 py-1 text-sm text-gray-700">
        {sizeInfo.size.value}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        0 шт.
      </td>
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Полный рефакторинг ячеек для идеального центрирования --- */}
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {isStockEditing ? (
          <div className="inline-flex items-center justify-center gap-2">
            <div className="flex items-baseline">
              <input
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                className={`${inputClassName} w-10`}
                disabled={isStockLoading}
                autoFocus
              />
              <span className="text-gray-500">шт.</span>
            </div>
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
            className="group relative inline-flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsStockEditing(true)}
          >
            <span>{sizeInfo.stock} шт.</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {isPriceEditing ? (
          <div className="inline-flex items-baseline justify-center">
            <input
              type="text"
              value={oldPriceValue}
              onChange={(e) => handleOldPriceChange(e.target.value)}
              className={`${inputClassName} w-16`}
              disabled={isPriceLoading}
            />
            <span className="text-gray-500">RUB</span>
          </div>
        ) : (
          <div
            className="group relative inline-flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsPriceEditing(true)}
          >
            <span>{formatPrice(oldPriceForDisplay)} RUB</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {isPriceEditing ? (
          <div className="inline-flex items-baseline justify-center">
            <input
              type="text"
              value={discountValue}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className={`${inputClassName} w-8`}
              disabled={isPriceLoading}
            />
            <span className="text-gray-500">%</span>
          </div>
        ) : (
          <div
            className="group relative inline-flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsPriceEditing(true)}
          >
            <span
              className={discountForDisplay > 0 ? 'font-bold text-red-600' : ''}
            >
              {discountForDisplay}%
            </span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm font-medium text-gray-800">
        {isPriceEditing ? (
          <div className="inline-flex items-center justify-center gap-2">
            <div className="flex items-baseline">
              <input
                type="text"
                value={priceValue}
                onChange={(e) => handlePriceChange(e.target.value)}
                className={`${inputClassName} w-16`}
                disabled={isPriceLoading}
              />
              <span className="text-gray-500">RUB</span>
            </div>
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
            className="group relative inline-flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsPriceEditing(true)}
          >
            <span>{formatPrice(priceForDisplay)} RUB</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-right text-sm font-bold text-gray-900">
        {formatPrice(totalValue)} RUB
      </td>
      <td className="w-24 px-6 py-1"></td>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </tr>
  );
}
