// Местоположение: src/components/admin/CreateProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProductForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  // VVV--- ИЗМЕНЕНИЕ: Состояние для description больше не нужно здесь ---VVV
  // const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          // VVV--- ИЗМЕНЕНИЕ: Отправляем пустой description, будем заполнять его на странице редактирования ---VVV
          description: '',
          status: 'DRAFT',
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось создать продукт');
      }

      const newProduct = await response.json();
      router.push(`/admin/products/${newProduct.id}/edit`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Произошла неизвестная ошибка',
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Название товара
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border-gray-300 bg-gray-50 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="например, Комплект белья 'Нежность'"
          />
        </div>
      </div>

      {/* VVV--- ИЗМЕНЕНИЕ: Полностью удален блок для Описания ---VVV */}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading || !name.trim()} // Кнопка неактивна, если имя пустое
          className="hover:bg-opacity-80 rounded-md border border-transparent bg-[#272727] px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? 'Создание...' : 'Создать и перейти к деталям →'}
        </button>
      </div>
    </form>
  );
}
