// Местоположение: src/components/admin/AddSizeForm.tsx

'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { Size } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { addProductSize } from '@/actions/product-actions';

interface AddSizeFormProps {
  productVariantId: string;
  allSizes: Size[];
  existingSizeIds: string[];
}

// Тип для оптимистичного обновления
type OptimisticSize = {
  id: string;
  sizeId: string;
  stock: number;
  size: { value: string };
  pending?: boolean;
};

export default function AddSizeForm({
  productVariantId,
  allSizes,
  existingSizeIds,
}: AddSizeFormProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [isPending, startTransition] = useTransition();

  // Оптимистичные обновления для лучшего UX
  const [optimisticSizes, addOptimisticSize] = useOptimistic(
    existingSizeIds,
    (state: string[], newSizeId: string) => [...state, newSizeId],
  );

  // Фильтруем размеры с учетом оптимистичных обновлений
  const availableSizes = allSizes.filter(
    (size) => !optimisticSizes.includes(size.id),
  );

  const handleSubmit = async (formData: FormData) => {
    const sizeId = selectedSize;
    const stockValue = parseInt(initialStock, 10);

    if (!sizeId) {
      toast.error('Пожалуйста, выберите размер');
      return;
    }

    // Оптимистично добавляем размер в UI
    addOptimisticSize(sizeId);

    // Сбрасываем форму сразу для лучшего UX
    setSelectedSize('');
    setInitialStock('0');

    startTransition(async () => {
      try {
        const result = await addProductSize(formData);

        if (result.success) {
          toast.success(result.message || 'Размер добавлен');
        } else {
          toast.error(result.error || 'Не удалось добавить размер');
          // В случае ошибки, возвращаем форму в исходное состояние
          setSelectedSize(sizeId);
          setInitialStock(stockValue.toString());
        }
      } catch (error) {
        toast.error('Произошла непредвиденная ошибка');
        setSelectedSize(sizeId);
        setInitialStock(stockValue.toString());
      }
    });
  };

  if (availableSizes.length === 0) {
    return (
      <p className="text-xs text-gray-500">Все возможные размеры добавлены.</p>
    );
  }

  return (
    <form action={handleSubmit} className="flex items-end space-x-4">
      <input type="hidden" name="productVariantId" value={productVariantId} />

      <div className="flex-grow">
        <label
          htmlFor="sizeId"
          className="block text-xs font-medium text-gray-700"
        >
          Размер
        </label>
        <select
          id="sizeId"
          name="sizeId"
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="">Выберите размер</option>
          {availableSizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="initialStock"
          className="block text-xs font-medium text-gray-700"
        >
          Начальный склад
        </label>
        <input
          type="number"
          id="initialStock"
          name="initialStock"
          value={initialStock}
          onChange={(e) => setInitialStock(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          min="0"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-fit rounded-md bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
      >
        {isPending ? 'Добавление...' : 'Добавить'}
      </button>
    </form>
  );
}
