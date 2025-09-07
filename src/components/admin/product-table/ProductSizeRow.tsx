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
  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles);
  return `${formattedNumber} RUB`;
};

type SizeInfo = Prisma.ProductSizeGetPayload<{
  include: { size: true };
}>;

interface ProductSizeRowProps {
  sizeInfo: SizeInfo;
  price: number | null;
  oldPrice: number | null;
  variantMoySkladId: string;
}

export function ProductSizeRow({
  sizeInfo,
  price,
  oldPrice,
  variantMoySkladId,
}: ProductSizeRowProps) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stockValue, setStockValue] = useState(String(sizeInfo.stock));

  const totalValue = (price || 0) * sizeInfo.stock;

  const handleSave = async () => {
    const newStock = parseInt(stockValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Введите корректное число.');
      return;
    }

    if (newStock === sizeInfo.stock) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем credentials: 'include' ---
    const promise = fetch('/api/admin/products/update-stock', {
      method: 'POST',
      credentials: 'include', // Эта строка решает проблему авторизации
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantMoySkladId: variantMoySkladId,
        newStock: newStock,
        productSizeId: sizeInfo.id,
      }),
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    toast.promise(promise, {
      loading: 'Обновляем остатки...',
      success: (res) => {
        if (!res.ok) throw new Error('Ошибка ответа сервера.');
        router.refresh();
        setIsEditing(false);
        return 'Остатки успешно обновлены!';
      },
      error: 'Не удалось обновить остатки.',
    });

    try {
      await promise;
    } catch (error) {
      // Ошибка уже обработана toast.promise
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStockValue(String(sizeInfo.stock));
    setIsEditing(false);
  };

  return (
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      <td className="w-24 px-4 py-1"></td>
      <td className="whitespace-nowrap px-6 py-1 text-sm text-gray-700">
        {sizeInfo.size.value}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              className="w-16 rounded-md border-gray-300 text-center shadow-sm"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="text-green-600 hover:text-green-800 disabled:text-gray-400"
            >
              {isLoading ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="text-red-500 hover:text-red-700 disabled:text-gray-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div
            className="group relative flex cursor-pointer items-center justify-center gap-2"
            onClick={() => setIsEditing(true)}
          >
            <span>{sizeInfo.stock} шт.</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        0 шт.
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {oldPrice && oldPrice > (price || 0) ? formatPrice(oldPrice) : '—'}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm font-medium text-gray-800">
        {formatPrice(price)}
      </td>
      <td className="w-40 whitespace-nowrap px-6 py-1 text-right text-sm font-bold text-gray-900">
        {formatPrice(totalValue)}
      </td>
      <td className="w-24 px-6 py-1"></td>
    </tr>
  );
}
