// Местоположение: src/components/admin/dashboard/ProductTable.tsx

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OptimizedProductForTable } from '@/app/admin/dashboard/page';
import { ProductTableRow } from '../product-table/ProductTableRow'; // ИСПРАВЛЕННЫЙ ПУТЬ
import DashboardControls from './DashboardControls'; // ИСПРАВЛЕННЫЙ ПУТЬ
import { SkeletonLoader, ToastViewport } from '@/components/shared/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { logEvent } from '@/lib/monitoring';
import { markEnd, markStart, measure } from '@/lib/performance';

interface ReferenceData {
  id: string;
  name: string;
}

interface FilterPresetItem {
  id: string;
  order: number;
  category: ReferenceData | null;
  tag: ReferenceData | null;
}

interface FilterPreset {
  id: string;
  name: string;
  items: FilterPresetItem[];
}

interface ProductTableProps {
  products: OptimizedProductForTable[];
  allCategories: ReferenceData[];
  allTags: ReferenceData[];
  allStatuses: ReferenceData[];
  filterPresets: FilterPreset[];
}

export default function ProductTable({
  products,
  allCategories,
  allTags,
  allStatuses,
  filterPresets,
}: ProductTableProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 350, { maxWait: 1200 });

  useEffect(() => {
    markStart('admin-product-table');
    console.log('🔄 ProductTable: начало отображения skeleton');
    const timer = setTimeout(() => {
      setIsTableLoading(false);
      markEnd('admin-product-table');
      measure('admin-product-table');
      logEvent({
        type: 'admin.table.ready',
        timestamp: Date.now(),
        payload: {
          totalProducts: products.length,
          totalTags: allTags.length,
        },
      });
      console.log('✅ ProductTable: данные готовы, skeleton скрыт');
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [products.length, allTags.length]);

  const handleSyncStart = useCallback(() => {
    console.log('🔄 ProductTable: синхронизация началась');
    setSyncProgress(5);
  }, []);

  const handleSyncProgress = useCallback((value: number) => {
    console.log('🔄 ProductTable: прогресс синхронизации', { value });
    setSyncProgress(value);
  }, []);

  const handleSyncComplete = useCallback(() => {
    console.log('✅ ProductTable: синхронизация завершена');
    setSyncProgress(null);
  }, []);

  const handleSyncError = useCallback(() => {
    console.log('❌ ProductTable: синхронизация завершилась ошибкой');
    setSyncProgress(null);
  }, []);

  // Мемоизированная фильтрация для производительности
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          product.article
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (product) => product.statusId === statusFilter,
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) =>
        product.categories.some((cat) => cat.id === categoryFilter),
      );
    }

    return filtered;
  }, [products, debouncedSearchTerm, statusFilter, categoryFilter]);

  // Статистика для отображения
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const filteredCount = filteredProducts.length;
    const totalVariants = products.reduce(
      (acc, p) => acc + p.variants.length,
      0,
    );
    const totalStock = products.reduce(
      (acc, p) =>
        acc +
        p.variants.reduce(
          (vacc, v) => vacc + v.sizes.reduce((sacc, s) => sacc + s.stock, 0),
          0,
        ),
      0,
    );

    return { totalProducts, filteredCount, totalVariants, totalStock };
  }, [products, filteredProducts]);

  return (
    <div className="w-full space-y-6">
      <ToastViewport />

      {/* Панель управления с фильтрами */}
      <div className="space-y-4 rounded-lg border bg-white p-6">
        <DashboardControls
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          onSyncStart={handleSyncStart}
          onSyncProgress={handleSyncProgress}
          onSyncComplete={handleSyncComplete}
          onSyncError={handleSyncError}
        />

        {/* Быстрая статистика */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalProducts}
            </div>
            <div className="text-sm text-gray-600">Всего товаров</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.filteredCount}
            </div>
            <div className="text-sm text-gray-600">Показано</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalVariants}
            </div>
            <div className="text-sm text-gray-600">Вариантов</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalStock}
            </div>
            <div className="text-sm text-gray-600">На складе</div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Поиск
            </label>
            <input
              type="text"
              placeholder="Название или артикул..."
              value={searchTerm}
              onChange={(e) => {
                console.log('🔄 ProductTable: ввод поиска', e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              {allStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Категория
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {typeof syncProgress === 'number' && (
        <div
          className="rounded-lg border border-blue-200 bg-blue-50 p-4"
          aria-live="assertive"
        >
          <p className="text-sm font-semibold text-blue-700">
            🔄 Синхронизация склада: {syncProgress}%
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-blue-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Таблица товаров */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            aria-busy={isTableLoading}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-2 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th className="w-12 px-2 py-3">
                  <span className="sr-only">Details</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Товар
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Остаток
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isTableLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10">
                    <SkeletonLoader rows={5} columns={6} />
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    isEditMode={isEditMode}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Информация о пагинации */}
        {!isTableLoading && filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-gray-500">
              {products.length === 0
                ? 'Товары не найдены'
                : 'Нет товаров, соответствующих фильтрам'}
            </div>
          </div>
        )}

        {products.length >= 50 && (
          <div className="border-t border-yellow-200 bg-yellow-50 px-6 py-3">
            <div className="flex items-center text-sm text-yellow-800">
              <span>
                ℹ️ Показаны первые 50 товаров. Используйте фильтры для уточнения
                поиска.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
