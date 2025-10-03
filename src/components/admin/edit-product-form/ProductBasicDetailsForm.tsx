// Местоположение: src/components/admin/edit-product-form/ProductBasicDetailsForm.tsx

'use client';

import { ProductWithDetails } from '@/lib/types';
import { Status } from '@prisma/client';
import { useProductForm } from '@/hooks/useProductForm';

interface ProductBasicDetailsFormProps {
  product: ProductWithDetails;
  allStatuses: Status[];
}

export function ProductBasicDetailsForm({
  product,
  allStatuses,
}: ProductBasicDetailsFormProps) {
  // Исправлено: isPending вместо isLoading
  const { formData, isPending, handleInputChange, updateProduct } =
    useProductForm(product, allStatuses);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProduct();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg bg-white p-8 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-900">Основные детали</h2>

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
            disabled={isPending}
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
            disabled={isPending}
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
          disabled={isPending}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end border-t pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? 'Сохранение...' : 'Сохранить детали'}
        </button>
      </div>
    </form>
  );
}
