// Местоположение: src/components/admin/EditProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { Size, Category, Tag, Status } from '@prisma/client';

// Определяем props, которые компонент ожидает получить
interface EditProductFormProps {
  product: ProductWithDetails;
  allSizes: Size[];
  allCategories: Category[];
  allTags: Tag[];
  allStatuses: Status[]; // <-- Ожидаем получить список статусов
}

export default function EditProductForm({
  product,
  allStatuses,
  // allCategories, allTags, allSizes - пока не используются, но готовы к работе
}: EditProductFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    // Работаем с ID статуса, это идеально для <select>
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
      // API эндпоинт для обновления продукта
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH', // Используем PATCH для частичного обновления
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // Отправляем name, description, statusId
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при сохранении');
      }

      alert('Детали сохранены!');
      router.refresh(); // Обновляем данные на странице
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg bg-white p-8 shadow"
    >
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
            name="statusId" // <-- Имя поля соответствует ключу в состоянии
            value={formData.statusId} // <-- Управляется состоянием
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            {/* Динамически рендерим опции из списка всех статусов */}
            {allStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
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
      <div className="flex justify-end border-t pt-6">
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
