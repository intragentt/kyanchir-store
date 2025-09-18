// Местоположение: src/components/admin/product-table/ProductTableRow.tsx
'use client';

import { useState, Fragment, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';
import type { Category, Tag } from '@prisma/client';

import type { ProductForTable } from '@/app/admin/dashboard/page';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { VariantRow } from './VariantRow';
import { ExpanderCell } from './ExpanderCell';

const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast.success('Артикул скопирован!');
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, []);
  return { isCopied, copy };
};

const statusConfig: Record<string, { dotClassName: string; label: string }> = {
  DRAFT: { dotClassName: 'bg-yellow-400', label: 'Черновик' },
  PUBLISHED: { dotClassName: 'bg-green-400', label: 'Опубликован' },
  ARCHIVED: { dotClassName: 'bg-gray-400', label: 'В архиве' },
};

const formatPrice = (priceInCents: number | null | undefined) => {
  if (priceInCents === null || priceInCents === undefined) return '0 RUB';
  const priceInRubles = priceInCents / 100;
  const formattedNumber = new Intl.NumberFormat('ru-RU').format(priceInRubles);
  return `${formattedNumber} RUB`;
};

const formatArticle = (article: string | null) => {
  if (!article) return { short: 'N/A', full: 'N/A' };
  const full = article;
  let short = article.startsWith('KYN-') ? article.substring(4) : article;
  if (short.length > 15) {
    short = short.substring(0, 12) + '...';
  }
  return { short, full };
};

interface ProductTableRowProps {
  product: ProductForTable;
  allCategories: Category[];
  allTags: Tag[];
  isEditMode: boolean;
}

export const ProductTableRow = ({
  product,
  allCategories, // --- ИЗМЕНЕНИЕ: Добавили allCategories в пропсы
  isEditMode,
}: ProductTableRowProps) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  const { isCopied, copy } = useCopyToClipboard();

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

  // --- НАЧАЛО НОВОЙ ФУНКЦИИ ---
  const handleCategoryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    e.stopPropagation();
    const newCategoryId = e.target.value;
    const currentCategoryId = product.categories[0]?.id;

    if (newCategoryId === currentCategoryId) return;

    setIsUpdatingCategory(true);
    const toastId = toast.loading('Перемещаем товар в новую группу...');

    try {
      const response = await fetch('/api/admin/products/update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          newCategoryId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось переместить товар');
      }

      toast.success('Товар успешно перемещен!', { id: toastId });
      router.refresh(); // Обновляем данные на странице
    } catch (error) {
      toast.error(
        `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        { id: toastId },
      );
    } finally {
      setIsUpdatingCategory(false);
    }
  };
  // --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Вы уверены, что хотите удалить товар "${product.name}"? Это действие необратимо.`,
      )
    ) {
      setIsDeleting(true);
      const toastId = toast.loading('Удаление товара...');
      try {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error((await response.json()).error || 'Ошибка удаления');
        }
        toast.success('Товар успешно удален!', { id: toastId });
        router.refresh();
      } catch (error) {
        toast.error(
          `Не удалось удалить: ${error instanceof Error ? error.message : 'Ошибка'}`,
          {
            id: toastId,
          },
        );
        setIsDeleting(false);
      }
    }
  };

  const { short: shortArticle, full: fullArticle } = formatArticle(
    product.article,
  );
  const rowClassName = isExpanded ? 'bg-indigo-50/50' : 'bg-white';
  const currentCategory = product.categories[0]; // Предполагаем, что у товара одна категория

  return (
    <Fragment>
      <tr className={`border-t ${rowClassName} hover:bg-gray-50`}>
        <td className="w-12 px-2 py-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>
        <td className="w-12 pl-2 pr-4 text-center">
          {isEditMode && (
            <Link
              href={`/admin/products/edit?id=${product.id}`}
              onClick={(e) => e.stopPropagation()}
              className="group flex-shrink-0 text-gray-400 hover:text-indigo-600"
              title="Редактировать детали"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
          )}
        </td>
        <ExpanderCell
          count={product.variants.length}
          isExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          level={1}
        />
        <td className="px-6 py-4" onClick={() => setIsExpanded(!isExpanded)}>
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
              <div className="group inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                <span>{product.name}</span>
                <div
                  className="flex items-center"
                  title={
                    statusConfig[product.status.name]?.label ||
                    product.status.name
                  }
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      statusConfig[product.status.name]?.dotClassName
                    }`}
                  />
                </div>
              </div>
              <div
                className="flex items-center gap-2 text-xs text-gray-500"
                title={fullArticle}
              >
                <span className="font-mono">{shortArticle}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copy(fullArticle);
                  }}
                  className="text-gray-400 hover:text-indigo-600"
                  title="Скопировать артикул"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </td>
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ В ЯЧЕЙКЕ --- */}
        <td className="px-6 py-4 text-xs">
          {isEditMode ? (
            <select
              value={currentCategory?.id || ''}
              onChange={handleCategoryChange}
              onClick={(e) => e.stopPropagation()}
              disabled={isUpdatingCategory}
              className="block w-full rounded-md border-gray-300 py-1 pl-2 pr-8 text-xs focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="" disabled>
                Выберите категорию
              </option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          ) : (
            <span>{currentCategory?.name || 'Без категории'}</span>
          )}
        </td>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ В ЯЧЕЙКЕ --- */}
        <td className="px-6 py-4 text-center text-sm">0 шт.</td>
        <td className="px-6 py-4 text-center text-sm">{totalStock} шт.</td>
        <td className="px-6 py-4 text-center text-sm font-bold">
          {calculateTotalValue()}
        </td>
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
          <td colSpan={9} className="p-0">
            <div className="bg-indigo-50/30">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100 text-xs uppercase text-gray-500">
                    <th className="w-12 px-2 py-2"></th>
                    <th className="w-12 pl-2 pr-4"></th>
                    <th className="w-12"></th>
                    <th className="px-6 py-2 text-left">Вариант</th>
                    <th className="w-40 px-6 py-2 text-center">Бронь</th>
                    <th className="w-40 px-6 py-2 text-center">Склад</th>
                    <th className="w-40 px-6 py-2 text-center">Старая сумма</th>
                    <th className="w-40 px-6 py-2 text-center">Сумма</th>
                    <th className="w-[112px] px-6 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {product.variants.map((variant) => (
                    <VariantRow
                      key={variant.id}
                      variant={variant}
                      parentProductArticle={product.article || ''}
                      isEditMode={isEditMode}
                    />
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
