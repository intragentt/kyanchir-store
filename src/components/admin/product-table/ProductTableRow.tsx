// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- ШАГ 1: Импортируем useRouter
import toast from 'react-hot-toast'; // <-- ШАГ 1: Импортируем toast
import type { Category, Tag } from '@prisma/client';

import type { ProductForTable } from '@/app/admin/dashboard/page';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { TrashIcon } from '@/components/icons/TrashIcon'; // <-- ШАГ 2: Импортируем иконку
import { VariantRow } from './VariantRow';

const statusConfig: Record<string, { dotClassName: string; label: string }> = {
  DRAFT: { dotClassName: 'bg-yellow-400', label: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', label: 'Опубликован' },
  ARCHIVED: { dotClassName: 'bg-gray-400', label: 'В архиве' },
};

const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '0 RUB';
  const priceInRubles = priceInCents / 100;

  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles);

  return `${formattedNumber} RUB`;
};

interface ProductTableRowProps {
  product: ProductForTable;
  allCategories: Category[];
  allTags: Tag[];
}

export const ProductTableRow = ({
  product,
  allCategories,
  allTags,
}: ProductTableRowProps) => {
  const router = useRouter(); // <-- Инициализируем роутер
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // <-- Состояние для процесса удаления

  const totalStock = product.variants.reduce(
    (sum, variant) =>
      sum + variant.sizes.reduce((s, size) => s + size.stock, 0),
    0,
  );

  const calculateTotalValue = () => {
    const totalValue = product.variants.reduce((sum, variant) => {
      const variantValue = variant.sizes.reduce((value, size) => {
        const priceToUse = size.price ?? variant.price ?? 0;
        return value + priceToUse * size.stock;
      }, 0);
      return sum + variantValue;
    }, 0);
    return formatPrice(totalValue);
  };

  // --- ШАГ 3: Создаем функцию удаления ---
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Останавливаем раскрытие строки

    if (
      window.confirm(
        `Вы уверены, что хотите удалить товар "${product.name}"? Это действие необратимо.`,
      )
    ) {
      setIsDeleting(true);
      const toastId = toast.loading('Удаление товара...');
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Ошибка сервера');
        }

        toast.success('Товар успешно удален!', { id: toastId });
        router.refresh(); // Обновляем таблицу
      } catch (error) {
        toast.error(
          `Не удалось удалить: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          { id: toastId },
        );
        setIsDeleting(false);
      }
      // isDeleting(false) не нужен в `finally`, т.к. страница перезагрузится
    }
  };

  const rowClassName = isExpanded ? 'bg-indigo-50/50' : 'bg-white';

  return (
    <Fragment>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className={`border-t ${rowClassName} cursor-pointer hover:bg-gray-50`}
      >
        <td className="w-24 px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="grid flex-shrink-0 grid-cols-2 gap-1">
              <Image
                src={product.variants[0]?.images[0]?.url || '/placeholder.png'}
                alt={`${product.name} фото 1`}
                width={40}
                height={50}
                className="h-12 w-9 rounded object-cover"
              />
              <Image
                src={product.variants[0]?.images[1]?.url || '/placeholder.png'}
                alt={`${product.name} фото 2`}
                width={40}
                height={50}
                className="h-12 w-9 rounded object-cover"
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {product.name}
              </div>
              {product.variants.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{product.variants.length} вариант</span>
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </div>
              )}
              <Link
                href={`/admin/products/${product.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                <PencilIcon className="h-3 w-3" />
                <span>Детали</span>
              </Link>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-xs">
          {product.categories.map((c) => c.name).join(' / ')}
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-x-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                statusConfig[product.status.name]?.dotClassName
              }`}
            />
            {statusConfig[product.status.name]?.label || product.status.name}
          </span>
        </td>
        <td className="px-6 py-4 text-center text-sm">0 шт.</td>
        <td className="px-6 py-4 text-center text-sm">{totalStock} шт.</td>
        <td className="px-6 py-4 text-center text-sm font-bold">
          {calculateTotalValue()}
        </td>
        {/* --- ШАГ 4: Добавляем новую ячейку для кнопки удаления --- */}
        <td className="px-6 py-4 text-center text-sm">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="Удалить товар"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          {/* --- ШАГ 4: Увеличиваем colSpan, чтобы учесть новую колонку --- */}
          <td colSpan={8} className="p-0">
            <div className="border-l-4 border-indigo-200 bg-indigo-50/30">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100 text-xs uppercase text-gray-500">
                    <th className="w-24 px-4 py-2"></th>
                    <th className="px-6 py-2 text-left">Вариант</th>
                    <th className="w-40 px-6 py-2 text-center">Бронь</th>
                    <th className="w-40 px-6 py-2 text-center">Склад</th>
                    <th className="w-40 px-6 py-2 text-center">Старая сумма</th>
                    <th className="w-40 px-6 py-2 text-center">Сумма</th>
                    {/* Пустая ячейка для выравнивания с новой колонкой */}
                    <th className="w-[112px] px-6 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {product.variants.map((variant) => (
                    <VariantRow key={variant.id} variant={variant} />
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
};
