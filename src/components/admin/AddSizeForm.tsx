// Местоположение: src/components/admin/AddSizeForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Size } from '@prisma/client';
import toast from 'react-hot-toast';

interface AddSizeFormProps {
  productVariantId: string;
  allSizes: Size[];
  // Передаем сюда размеры, которые уже есть у варианта, чтобы не дублировать
  existingSizeIds: string[];
}

export default function AddSizeForm({
  productVariantId,
  allSizes,
  existingSizeIds,
}: AddSizeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Фильтруем размеры, чтобы в выпадающем списке были только те, которых еще нет
  const availableSizes = allSizes.filter(
    (size) => !existingSizeIds.includes(size.id),
  );

  const [sizeId, setSizeId] = useState(availableSizes[0]?.id || '');
  const [stock, setStock] = useState(0);

  // Если добавлять больше нечего, не показываем форму
  if (availableSizes.length === 0) {
    return (
      <p className="text-xs text-gray-400">Все доступные размеры добавлены.</p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeId) {
      toast.error('Необходимо выбрать размер.');
      return;
    }
    if (stock <= 0) {
      toast.error('Количество на складе должно быть больше нуля.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Добавляем размер...');

    try {
      const response = await fetch('/api/admin/product-sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId,
          sizeId,
          stock,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast.success('Размер и остаток добавлены!', { id: toastId });
      // Сбрасываем форму и обновляем всю страницу
      setStock(0);
      setSizeId(availableSizes[1]?.id || ''); // Переключаемся на следующий доступный
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка', {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label
          htmlFor="sizeId"
          className="block text-xs font-medium text-gray-600"
        >
          Размер
        </label>
        <select
          id="sizeId"
          value={sizeId}
          onChange={(e) => setSizeId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        >
          {availableSizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.value}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label
          htmlFor="stock"
          className="block text-xs font-medium text-gray-600"
        >
          Начальный склад
        </label>
        <input
          type="number"
          id="stock"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          min="0"
          className="mt-1 block w-full rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="h-fit rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 disabled:opacity-50"
      >
        +
      </button>
    </form>
  );
}
