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

  const [isStockEditing, setIsStockEditing] = useState(false);
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [stockValue, setStockValue] = useState(String(sizeInfo.stock));
  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const displayPrice = sizeInfo.price ?? variantPrice;
  const displayOldPrice = sizeInfo.oldPrice ?? variantOldPrice;
  const [priceValue, setPriceValue] = useState(
    String(displayPrice ? displayPrice / 100 : ''),
  );
  const [oldPriceValue, setOldPriceValue] = useState(
    String(displayOldPrice ? displayOldPrice / 100 : ''),
  );
  const totalValue = (displayPrice || 0) * sizeInfo.stock;

  const handlePriceSave = async () => {
    if (!sizeInfo.moySkladHref) {
      toast.error('Ошибка: Href размера из МойСклад не найден.');
      return;
    }
    setIsPriceLoading(true);
    const newPrice = priceValue
      ? Math.round(parseFloat(priceValue) * 100)
      : null;
    const newOldPrice = oldPriceValue
      ? Math.round(parseFloat(oldPriceValue) * 100)
      : null;
    const promise = fetch('/api/admin/products/update-size-price', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moySkladHref: sizeInfo.moySkladHref,
        productSizeId: sizeInfo.id,
        newPrice,
        newOldPrice,
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
    setPriceValue(String(displayPrice ? displayPrice / 100 : ''));
    setOldPriceValue(String(displayOldPrice ? displayOldPrice / 100 : ''));
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

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем порядок ячеек в строке Уровня 3 ---
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      <td className="w-24 px-4 py-1"></td>
      <td className="whitespace-nowrap px-6 py-1 text-sm text-gray-700">
        <div className="group flex items-center gap-2">
          <span>{sizeInfo.size.value}</span>
          <button
            onClick={() => setIsPriceEditing(true)}
            className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        </div>
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
            placeholder="Старая цена"
            value={oldPriceValue}
            onChange={(e) => setOldPriceValue(e.target.value)}
            className="w-24 rounded-md border-gray-300 text-center shadow-sm"
            disabled={isPriceLoading}
          />
        ) : (
          formatPrice(displayOldPrice)
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm font-medium text-gray-800">
        {isPriceEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              placeholder="Цена"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
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
          formatPrice(displayPrice)
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-right text-sm font-bold text-gray-900">
        {formatPrice(totalValue)}
      </td>
      <td className="w-24 px-6 py-1"></td>
    </tr>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}
