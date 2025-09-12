// Местоположение: src/components/admin/AddSizeForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Size } from '@prisma/client';
import toast from 'react-hot-toast';

interface AddSizeFormProps {
  productVariantId: string;
  allSizes: Size[];
  existingSizeIds: string[];
}

export default function AddSizeForm({
  productVariantId,
  allSizes,
  existingSizeIds,
}: AddSizeFormProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  // Фильтруем размеры, чтобы не показывать уже добавленные
  const availableSizes = allSizes.filter(
    (size) => !existingSizeIds.includes(size.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSize) {
      toast.error('Пожалуйста, выберите размер.');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Добавляем размер...');

    try {
      const response = await fetch('/api/admin/product-sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId: productVariantId,
          sizeId: selectedSize,
          // --- ИЗМЕНЕНИЕ: Отправляем правильное поле initialStock ---
          initialStock: parseInt(initialStock, 10),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Не удалось добавить размер');
      }

      toast.success('Размер добавлен!', { id: toastId });
      // --- ИЗМЕНЕНИЕ: Сбрасываем форму в исходное состояние ---
      setSelectedSize('');
      setInitialStock('0');
      router.refresh(); // Обновляем страницу, чтобы увидеть новый размер
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка', {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (availableSizes.length === 0) {
    return (
      <p className="text-xs text-gray-500">Все возможные размеры добавлены.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-4">
      <div className="flex-grow">
        <label
          htmlFor="size"
          className="block text-xs font-medium text-gray-700"
        >
          Размер
        </label>
        <select
          id="size"
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
          htmlFor="stock"
          className="block text-xs font-medium text-gray-700"
        >
          Начальный склад
        </label>
        <input
          type="number"
          id="stock"
          value={initialStock}
          onChange={(e) => setInitialStock(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          min="0"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="h-fit rounded-md bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
      >
        {isLoading ? '...' : 'Добавить'}
      </button>
    </form>
  );
}
