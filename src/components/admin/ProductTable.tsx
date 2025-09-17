// Местоположение: src/components/admin/ProductTable.tsx
'use client';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Упрощаем импорты ---
import type { ProductForTable } from '@/app/admin/dashboard/page';
import type { Prisma, Category, Tag } from '@prisma/client';
import { ProductTableRow } from './product-table/ProductTableRow';
import DashboardControls from './DashboardControls'; // <-- Импортируем новый компонент
import { Toaster } from 'react-hot-toast';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Вся логика кнопок удалена ---
  // Больше нет стейтов isSyncing, isResetting и т.д.
  // Больше нет обработчиков handleSync, handleReset и т.д.
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <div className="w-full">
      <Toaster position="top-center" />
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Вставляем новый компонент --- */}
      <DashboardControls />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border-b border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="relative w-24 px-1 py-3 text-center"
                  ></th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Бронь
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Склад
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Сумма
                  </th>
                </tr>
              </thead>
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
