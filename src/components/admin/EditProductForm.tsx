// Местоположение: src/components/admin/EditProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { Size, Category, Tag, Status } from '@prisma/client';
import toast, { Toaster } from 'react-hot-toast';
import AddVariantForm from './AddVariantForm';
import AddSizeForm from './AddSizeForm'; // <-- Импортируем новый компонент

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
  allSizes, // <-- Нам понадобятся все размеры
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
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        {/* ... (содержимое формы без изменений) ... */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
        <div className="space-y-6">
          {product.variants.length > 0 ? (
            product.variants.map((variant) => (
              <div key={variant.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-semibold text-gray-800">
                    {variant.color}
                  </h3>
                  {/* Здесь будут кнопки удаления/редактирования варианта */}
                </div>

                {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Блок управления размерами --- */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-600">
                    Размеры и остатки
                  </h4>

                  {/* Список существующих размеров для этого варианта */}
                  <div className="mt-2 space-y-2">
                    {variant.sizes.length > 0 ? (
                      variant.sizes.map((sizeInfo) => (
                        <div
                          key={sizeInfo.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            Размер:{' '}
                            <span className="font-bold">
                              {sizeInfo.size.value}
                            </span>
                          </span>
                          <span>
                            Склад:{' '}
                            <span className="font-bold">
                              {sizeInfo.stock} шт.
                            </span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">
                        У этого варианта еще нет размеров.
                      </p>
                    )}
                  </div>

                  {/* Форма добавления нового размера */}
                  <div className="mt-4">
                    <AddSizeForm
                      productVariantId={variant.id}
                      allSizes={allSizes}
                      existingSizeIds={variant.sizes.map((s) => s.sizeId)}
                    />
                  </div>
                </div>
                {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              У этого товара еще нет вариантов.
            </p>
          )}
        </div>

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
