// Местоположение: src/components/admin/EditProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { Size, Category, Tag, Status } from '@prisma/client';
import toast, { Toaster } from 'react-hot-toast';
import AddVariantForm from './AddVariantForm'; // <-- Импортируем наш новый компонент

interface EditProductFormProps {
  product: ProductWithDetails;
  allSizes: Size[];
  allCategories: Category[];
  allTags: Tag[];
  allStatuses: Status[];
}

export default function EditProductForm({
  product,
  allStatuses,
}: EditProductFormProps) {
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
    const toastId = toast.loading('Сохраняем детали...');

    try {
      // Используем старый API эндпоинт для обновления базовых деталей
      const response = await fetch(`/api/products/${product.id}`, {
        // Метод PUT, т.к. старый API ожидает его. PATCH можно будет сделать при рефакторинге.
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Собираем полное тело запроса, которое ожидает старый API
        body: JSON.stringify({
          ...formData,
          article: product.article,
          variants: product.variants,
          categories: product.categories.map((c) => ({ id: c.id })),
          tags: product.tags.map((t) => ({ id: t.id })),
          attributes: product.attributes,
          alternativeNames: product.alternativeNames,
          status: allStatuses.find((s) => s.id === formData.statusId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Ошибка при сохранении');
      }

      toast.success('Детали сохранены!', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Неизвестная ошибка',
        { id: toastId },
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <Toaster position="top-center" />
      {/* --- Блок 1: Редактирование основных деталей --- */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg bg-white p-8 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900">Основные детали</h2>

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

      {/* --- Блок 2: Управление вариантами --- */}
      <div className="space-y-6 rounded-lg bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Варианты (цвета)
        </h2>

        {/* Список существующих вариантов */}
        <div className="space-y-2">
          {product.variants.length > 0 ? (
            product.variants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="font-medium">{variant.color}</span>
                {/* Здесь в будущем будут кнопки для редактирования/удаления */}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              У этого товара еще нет вариантов.
            </p>
          )}
        </div>

        {/* Форма добавления нового варианта */}
        <div className="border-t pt-6">
          <h3 className="text-md font-medium text-gray-800">
            Добавить новый вариант
          </h3>
          <div className="mt-4">
            <AddVariantForm productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
