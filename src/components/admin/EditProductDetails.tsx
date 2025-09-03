'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// --- НАЧАЛО ИЗМЕНЕНИЙ (1/4): Импортируем Prisma для создания типа ---
import { Prisma } from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ (2/4): Создаем правильный тип, который включает статус ---
type ProductWithStatus = Prisma.ProductGetPayload<{
  include: {
    status: true;
  };
}>;

interface EditProductDetailsProps {
  product: ProductWithStatus;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ (2/4) ---

export default function EditProductDetails({
  product,
}: EditProductDetailsProps) {
  const router = useRouter();
  // --- НАЧАЛО ИЗМЕНЕНИЙ (3/4): Работаем с statusId, а не с объектом ---
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    statusId: product.statusId, // <-- Используем ID
  });
  // --- КОНЕЦ ИЗМЕНЕНИЙ (3/4) ---
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
        body: JSON.stringify(formData), // Отправляем данные, включая statusId
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
          {/* --- НАЧАЛО ИЗМЕНЕНИЙ (4/4): Исправляем select --- */}
          <select
            id="statusId"
            name="statusId" // <-- меняем name на statusId
            value={formData.statusId} // <-- value теперь statusId
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            {/* Вам нужно будет передать список статусов из БД, но для примера пока так */}
            <option value="ID_статуса_DRAFT">Черновик</option>
            <option value="ID_статуса_PUBLISHED">Опубликован</option>
            <option value="ID_статуса_ARCHIVED">В архиве</option>
          </select>
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ (4/4) --- */}
          {/* ПРИМЕЧАНИЕ: В идеале, нужно загрузить статусы из `prisma.status.findMany()` и отрендерить их здесь, используя их ID в качестве value. */}
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
