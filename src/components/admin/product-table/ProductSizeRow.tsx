// Местоположение: /src/components/admin/product-table/ProductSizeRow.tsx
'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';

import { PencilIcon } from '@/components/icons/PencilIcon';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { XMarkIcon } from '@/components/icons/XMarkIcon';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';

// Кастомный хук для копирования
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

const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '—';
  const priceInRubles = priceInCents / 100;
  return new Intl.NumberFormat('ru-RU').format(priceInRubles);
};

const calculateDiscount = (oldPrice: number | null, price: number | null) => {
  if (oldPrice && price && oldPrice > price) {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }
  return 0;
};

// --- ШАГ 1: Обновляем тип, чтобы он включал `code` ---
type SizeInfo = Prisma.ProductSizeGetPayload<{
  include: { size: true };
}> & {
  code: string | null;
  moySkladHref: string | null;
  moySkladType: string;
  price: number | null;
  oldPrice: number | null;
};

// --- ШАГ 2: Обновляем пропсы ---
interface ProductSizeRowProps {
  sizeInfo: SizeInfo;
  variantPrice: number | null;
  variantOldPrice: number | null;
  variantArticle: string;
}

export function ProductSizeRow({
  sizeInfo,
  variantPrice,
  variantOldPrice,
  variantArticle,
}: ProductSizeRowProps) {
  const router = useRouter();
  const { isCopied, copy } = useCopyToClipboard();

  const [editMode, setEditMode] = useState<'none' | 'stock' | 'price'>('none');
  const [isSaving, setIsSaving] = useState(false);

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

  const [stockValue, setStockValue] = useState(String(sizeInfo.stock));
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

  // --- ШАГ 3: Генерируем финальный артикул ---
  const finalArticle = `${variantArticle}-${sizeInfo.size.value}`;

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
    let newPrice = parseFloat(priceValue.replace(',', '.'));
    let newOldPrice = parseFloat(oldPriceValue.replace(',', '.'));

    if (isNaN(newPrice) || isNaN(newOldPrice)) {
      toast.error('Введите корректные числовые значения для цен.');
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading('Обновляем цены...');
    if (newPrice > newOldPrice) newOldPrice = newPrice;

    try {
      const response = await fetch(`/api/admin/product-sizes/${sizeInfo.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Math.round(newPrice * 100),
          oldPrice: Math.round(newOldPrice * 100),
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast.success('Цены успешно обновлены!', { id: toastId });
      router.refresh();
      setEditMode('none');
    } catch (error) {
      toast.error(
        `Не удалось обновить: ${error instanceof Error ? error.message : 'Ошибка'}`,
        {
          id: toastId,
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStockSave = async () => {
    const newStock = parseInt(stockValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Введите корректное число.');
      return;
    }
    if (newStock === sizeInfo.stock) {
      setEditMode('none');
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading('Обновляем остатки...');
    try {
      const response = await fetch(`/api/admin/product-sizes/${sizeInfo.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast.success('Остатки успешно обновлены!', { id: toastId });
      router.refresh();
      setEditMode('none');
    } catch (error) {
      toast.error(
        `Не удалось обновить: ${error instanceof Error ? error.message : 'Ошибка'}`,
        {
          id: toastId,
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (editMode === 'stock') setStockValue(String(sizeInfo.stock));
    if (editMode === 'price') {
      setPriceValue(priceForDisplay ? (priceForDisplay / 100).toString() : '');
      setOldPriceValue(
        oldPriceForDisplay ? (oldPriceForDisplay / 100).toString() : '',
      );
      setDiscountValue(String(discountForDisplay));
    }
    setEditMode('none');
  };

  const handleSave = () => {
    if (editMode === 'stock') handleStockSave();
    if (editMode === 'price') handlePriceSave();
  };

  const inputClassName =
    'bg-transparent border-0 border-b border-indigo-400 p-0 text-right text-sm focus:ring-0 disabled:bg-gray-100';

  return (
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      <td className="w-12 pl-8"></td>
      <td className="w-12 px-2 py-1"></td>
      <td className="whitespace-nowrap px-6 py-1 text-sm text-gray-700">
        {sizeInfo.size.value}
      </td>
      {/* --- ШАГ 4: Добавляем ячейку с артикулом --- */}
      <td className="px-6 py-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-700">{finalArticle}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copy(finalArticle);
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
      <td className="w-32 whitespace-nowrap px-6 py-1 text-right text-sm text-gray-500">
        0 шт.
      </td>
      <td className="w-32 whitespace-nowrap px-6 py-1 text-right text-sm text-gray-500">
        {editMode === 'stock' ? (
          <div className="flex items-baseline justify-end">
            <input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              className={`${inputClassName} w-10`}
              disabled={isSaving}
              autoFocus
            />
            <span className="text-gray-500">шт.</span>
          </div>
        ) : (
          <div
            className="group relative inline-flex cursor-pointer items-center justify-end gap-2"
            onClick={() => !isSaving && setEditMode('stock')}
          >
            <span>{sizeInfo.stock} шт.</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-32 whitespace-nowrap px-6 py-1 text-right text-sm text-gray-500">
        {editMode === 'price' ? (
          <div className="flex items-baseline justify-end">
            <input
              type="text"
              value={oldPriceValue}
              onChange={(e) => handleOldPriceChange(e.target.value)}
              className={`${inputClassName} w-16`}
              disabled={isSaving}
              autoFocus
            />
            <span className="text-gray-500">RUB</span>
          </div>
        ) : (
          <div
            className="group relative inline-flex cursor-pointer items-center justify-end gap-2"
            onClick={() => !isSaving && setEditMode('price')}
          >
            <span>{formatPrice(oldPriceForDisplay)} RUB</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-32 whitespace-nowrap px-6 py-1 text-right text-sm text-gray-500">
        {editMode === 'price' ? (
          <div className="flex items-baseline justify-end">
            <input
              type="text"
              value={discountValue}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className={`${inputClassName} w-8`}
              disabled={isSaving}
            />
            <span className="text-gray-500">%</span>
          </div>
        ) : (
          <div
            className="group relative inline-flex cursor-pointer items-center justify-end gap-2"
            onClick={() => !isSaving && setEditMode('price')}
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
      <td className="w-32 whitespace-nowrap px-6 py-1 text-right text-sm font-medium text-gray-800">
        {editMode === 'price' ? (
          <div className="flex items-baseline justify-end">
            <input
              type="text"
              value={priceValue}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={`${inputClassName} w-16`}
              disabled={isSaving}
            />
            <span className="text-gray-500">RUB</span>
          </div>
        ) : (
          <div
            className="group relative inline-flex cursor-pointer items-center justify-end gap-2"
            onClick={() => !isSaving && setEditMode('price')}
          >
            <span>{formatPrice(priceForDisplay)} RUB</span>
            <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
      <td className="w-32 whitespace-nowrap px-6 py-1 text-right text-sm font-bold text-gray-900">
        {formatPrice(totalValue)} RUB
      </td>
      <td className="w-24 px-6 py-1">
        {editMode !== 'none' && (
          <div className="flex items-center justify-start gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-green-600 hover:text-green-800 disabled:text-gray-400"
              title="Сохранить"
            >
              {isSaving ? (
                <SpinnerIcon className="h-5 w-5" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-red-500 hover:text-red-700 disabled:text-gray-400"
              title="Отменить"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
