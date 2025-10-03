// Местоположение: src/components/admin/product-table/ProductDetailsPanel.tsx

'use client';

import type { OptimizedProductForTable } from '@/app/admin/dashboard/page';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { Attribute } from '@prisma/client';

interface ProductDetailsPanelProps {
  product: OptimizedProductForTable;
}

export const ProductDetailsPanel = ({ product }: ProductDetailsPanelProps) => {
  // В оптимизированном типе может не быть поля attributes
  // Создаем пустой массив если его нет
  const attributes =
    'attributes' in product && Array.isArray(product.attributes)
      ? (product.attributes as Attribute[])
      : [];

  // Безопасное получение description
  const getDescription = (): string => {
    if ('description' in product && typeof product.description === 'string') {
      return product.description;
    }
    return '';
  };

  return (
    <tr>
      <td colSpan={8} className="p-0">
        <div className="border-l-4 border-green-200 bg-green-50/30 p-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Левая колонка: Описание */}
            <div>
              <label
                htmlFor={`desc-${product.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Описание
              </label>
              <textarea
                id={`desc-${product.id}`}
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                defaultValue={getDescription()}
                placeholder="Введите описание товара..."
              />
              <button className="mt-2 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                Сохранить описание
              </button>
            </div>

            {/* Правая колонка: Атрибуты */}
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Атрибуты
                {product._count && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({product._count.attributes})
                  </span>
                )}
              </h3>

              <div className="mt-2 space-y-2">
                {attributes.length > 0 ? (
                  attributes.map((attr: Attribute) => (
                    <div key={attr.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={attr.key || ''}
                        className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm"
                        placeholder="Название (напр. Состав)"
                      />
                      <input
                        type="text"
                        defaultValue={attr.value || ''}
                        className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm"
                        placeholder="Значение (напр. 100% хлопок)"
                      />
                      <button
                        disabled
                        className="text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Удаление атрибутов временно отключено"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm italic text-gray-500">
                    Атрибуты не загружены (оптимизировано для
                    производительности)
                  </div>
                )}

                <button className="w-full rounded-md border-2 border-dashed border-gray-300 bg-white py-1.5 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700">
                  + Добавить атрибут
                </button>
              </div>

              {/* Показываем количество атрибутов из _count если они не загружены */}
              {attributes.length === 0 &&
                product._count &&
                product._count.attributes > 0 && (
                  <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <div className="text-sm text-blue-800">
                      ℹ️ У этого товара есть {product._count.attributes}{' '}
                      атрибут(ов). Для редактирования перейдите на страницу
                      детального редактирования.
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};
