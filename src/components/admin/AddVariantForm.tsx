// Местоположение: src/components/admin/AddVariantForm.tsx

'use client';

import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';
import { addProductVariant } from '@/actions/product-actions';

interface AddVariantFormProps {
  productId: string;
}

export default function AddVariantForm({ productId }: AddVariantFormProps) {
  const [color, setColor] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    const colorValue = color.trim();

    if (!colorValue) {
      toast.error('Название цвета не может быть пустым');
      return;
    }

    // Сбрасываем форму сразу для оптимистичного UX
    setColor('');

    startTransition(async () => {
      try {
        const result = await addProductVariant(formData);

        if (result.success) {
          toast.success(result.message || 'Вариант добавлен');
        } else {
          toast.error(result.error || 'Не удалось добавить вариант');
          // Возвращаем значение в случае ошибки
          setColor(colorValue);
        }
      } catch (error) {
        toast.error('Произошла непредвиденная ошибка');
        setColor(colorValue);
      }
    });
  };

  return (
    <form action={handleSubmit} className="flex items-center gap-4">
      <input type="hidden" name="productId" value={productId} />

      <div>
        <label htmlFor="color" className="sr-only">
          Название цвета
        </label>
        <input
          type="text"
          id="color"
          name="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="Например, Черный"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
          maxLength={50}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
      >
        {isPending ? 'Добавление...' : '+ Добавить вариант'}
      </button>
    </form>
  );
}
