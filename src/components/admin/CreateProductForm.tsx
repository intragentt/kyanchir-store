// Местоположение: src/components/admin/CreateProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Status } from '@prisma/client';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface CreateProductFormProps {
  categories: Category[];
  statuses: Status[];
}

export default function CreateProductForm({
  categories,
  statuses,
}: CreateProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    article: '',
    description: '',
    categoryId: categories[0]?.id || '',
    statusId:
      statuses.find((s) => s.name === 'DRAFT')?.id || statuses[0]?.id || '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Создаём товар...');

    try {
      const response = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Ошибка: ${response.status} - ${errorData}`);
      }

      const newProduct = await response.json();

      toast.success('Товар успешно создан! Переходим к деталям...', {
        id: toastId,
      });

      // --- ИЗМЕНЕНИЕ: Редирект на страницу редактирования ---
      router.push(`/admin/products/${newProduct.id}/edit`);
    } catch (error) {
      console.error('Не удалось создать товар:', error);
      toast.error(
        error instanceof Error ? error.message : 'Произошла неизвестная ошибка',
        { id: toastId },
      );
      // В случае ошибки оставляем пользователя на форме
      setIsLoading(false);
    }
    // setIsLoading(false) убран из `finally`, чтобы не сбрасывать состояние при успешном редиректе
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
    >
      <Toaster position="top-center" />

      {/* Название товара */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Название товара
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Например, Комплект 'Нежность'"
        />
      </div>

      {/* Артикул */}
      <div>
        <label
          htmlFor="article"
          className="block text-sm font-medium text-gray-700"
        >
          Артикул
        </label>
        <input
          type="text"
          id="article"
          name="article"
          value={formData.article}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Генерируется автоматически, если оставить пустым"
        />
      </div>

      {/* Описание */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Ключевые фичи, уход, ощущения..."
        ></textarea>
      </div>

      {/* Категория */}
      <div>
        <label
          htmlFor="categoryId"
          className="block text-sm font-medium text-gray-700"
        >
          Категория
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Статус */}
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
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center justify-end gap-x-4 border-t border-gray-200 pt-6">
        <Link
          href="/admin/dashboard"
          className="text-sm font-semibold text-gray-600 hover:text-gray-800"
        >
          Отмена
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {/* --- ИЗМЕНЕНИЕ: Текст кнопки --- */}
          {isLoading ? 'Создание...' : 'Создать и перейти к деталям'}
        </button>
      </div>
    </form>
  );
}
