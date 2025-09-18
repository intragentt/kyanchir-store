// Местоположение: src/components/admin/ProductTable.tsx
'use client';

import type { ProductForTable } from '@/app/admin/dashboard/page';
import type { Prisma, Category, Tag } from '@prisma/client';
import { ProductTableRow } from './product-table/ProductTableRow';
import DashboardControls from './DashboardControls';
import { Toaster } from 'react-hot-toast';

type FilterPresetWithItems = Prisma.FilterPresetGetPayload<{
  include: { items: { include: { category: true; tag: true } } };
}>;

interface ProductTableProps {
  products: ProductForTable[];
  allCategories: Category[];
  allTags: Tag[];
  filterPresets: FilterPresetWithItems[];
}

export default function ProductTable({
  products,
  allCategories,
  allTags,
  filterPresets,
}: ProductTableProps) {
  return (
    <div className="w-full">
      <Toaster position="top-center" />
      <DashboardControls />

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border-b border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              {/* --- НАЧАЛО ИЗМЕНЕНИЙ В ШАПКЕ ТАБЛИЦЫ --- */}
              <thead className="bg-gray-50">
                <tr>
                  {/* 1. Пустая ячейка для ExpanderCell */}
                  <th scope="col" className="w-12 pl-4">
                    <span className="sr-only">Expand</span>
                  </th>
                  {/* 2. Пустая ячейка для Checkbox */}
                  <th scope="col" className="w-12 px-2">
                    <span className="sr-only">Select</span>
                  </th>
                  {/* 3. Товар */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Товар
                  </th>
                  {/* 4. Тип (остается без изменений) */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Тип
                  </th>
                  {/* 5. Статус */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Статус
                  </th>
                  {/* 6. Бронь */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Бронь
                  </th>
                  {/* 7. Склад */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Склад
                  </th>
                  {/* 8. Сумма */}
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Сумма
                  </th>
                  {/* 9. Пустая ячейка для кнопки "Удалить" */}
                  <th scope="col" className="relative w-[112px] px-6 py-3">
                    <span className="sr-only">Действия</span>
                  </th>
                </tr>
              </thead>
              {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((product) => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    allCategories={allCategories}
                    allTags={allTags}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
