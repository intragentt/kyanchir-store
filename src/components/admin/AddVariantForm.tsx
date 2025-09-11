// Местоположение: src/components/admin/AddVariantForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AddVariantFormProps {
  productId: string;
}

export default function AddVariantForm({ productId }: AddVariantFormProps) {
  const router = useRouter();
  const [color, setColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!color.trim()) {
      toast.error('Название цвета не может быть пустым.');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Добавляем вариант...');

    try {
      const response = await fetch('/api/admin/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, color }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast.success('Вариант успешно добавлен!', { id: toastId });
      setColor('');
      router.refresh(); // Обновляем страницу, чтобы показать новый вариант
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
    <form onSubmit={handleSubmit} className="flex items-center gap-4">
      <div>
        <label htmlFor="color" className="sr-only">
          Название цвета
        </label>
        <input
          type="text"
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="Например, Черный"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Добавление...' : '+ Добавить вариант'}
      </button>
    </form>
  );
}
