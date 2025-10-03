// Местоположение: src/components/admin/EditProductDetails.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithStatus } from '@/lib/types';

interface EditProductDetailsProps {
  product: ProductWithStatus;
}

export default function EditProductDetails({
  product,
}: EditProductDetailsProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    statusId: product.statusId,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Ошибка при сохранении');
      }

      alert('Детали сохранены!');
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Поле Название */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Название
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Поле Статус */}
        <div>
          <label
            htmlFor="statusId"
            className="block text-sm font-medium text-gray-700"
          >
            Статус
          </label>
          <select
            id="statusId"
            name="statusId"
            value={formData.statusId}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="ID_статуса_DRAFT">Черновик</option>
            <option value="ID_статуса_PUBLISHED">Опубликован</option>
            <option value="ID_статуса_ARCHIVED">В архиве</option>
          </select>
          {/* ПРИМЕЧАНИЕ: В идеале нужно загрузить статусы из prisma.status.findMany() */}
        </div>
      </div>

      {/* Поле Описание */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Описание
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Сохранение...' : 'Сохранить детали'}
        </button>
      </div>
    </form>
  );
}
