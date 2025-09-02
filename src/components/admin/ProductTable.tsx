// Местоположение: src/components/admin/ProductTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import type { ProductForTable } from '@/app/admin/dashboard/page';
import type { Prisma, Category, Tag } from '@prisma/client';
import { ProductTableRow } from './product-table/ProductTableRow';

// Тип для filterPresets (без изменений)
type FilterPresetWithItems = Prisma.FilterPresetGetPayload<{
  include: {
    items: {
      include: {
        category: true;
        tag: true;
      };
    };
  };
}>;

// Иконки (без изменений)
const SyncIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
      clipRule="evenodd"
    />
  </svg>
);
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M5.5 16a3.5 3.5 0 01-3.5-3.5V5.5A3.5 3.5 0 015.5 2h5.086a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V12.5A3.5 3.5 0 0112.5 16h-7zM5 5.5A1.5 1.5 0 003.5 7v5.5A1.5 1.5 0 005 14h7.5a1.5 1.5 0 001.5-1.5V8.586L8.586 4H5.5A1.5 1.5 0 005 5.5z" />
    <path d="M7 8a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

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
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);

    const syncPromise = Promise.resolve().then(async () => {
      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      // ВРЕМЕННО КОММЕНТИРУЕМ ОЧИСТКУ, Т.К. API ЕЩЕ НЕ ГОТОВ
      /*
      console.log("Очистка продуктов и категорий перед синхронизацией...");
      const clearRes = await fetch('/api/admin/clear-data', { method: 'POST' });
      if(!clearRes.ok) throw new Error('Ошибка при очистке данных перед синхронизацией.');
      */
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---

      console.log('Синхронизация категорий...');
      const catRes = await fetch('/api/admin/sync/categories', {
        method: 'POST',
      });
      if (!catRes.ok) {
        const err = await catRes.json();
        throw new Error(err.error || 'Ошибка синхронизации категорий');
      }

      console.log('Синхронизация продуктов...');
      const prodRes = await fetch('/api/admin/sync/products', {
        method: 'POST',
      });
      if (!prodRes.ok) {
        const err = await prodRes.json();
        throw new Error(err.error || 'Ошибка синхронизации продуктов');
      }

      return 'Данные успешно обновлены!';
    });

    toast.promise(syncPromise, {
      loading: 'Синхронизация со складом...',
      success: (message) => {
        router.refresh();
        setIsSyncing(false);
        return String(message);
      },
      error: (err) => {
        setIsSyncing(false);
        return `Ошибка: ${err.toString()}`;
      },
    });
  };

  return (
    <div className="w-full">
      <Toaster position="top-center" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-x-2 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SyncIcon
              className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
            />
            {isSyncing ? 'Синхронизация...' : 'Синхронизировать склад'}
          </button>

          <button className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <UploadIcon className="h-4 w-4" /> Загрузить CSV
          </button>
          <button className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <DownloadIcon className="h-4 w-4" /> Выгрузить CSV
          </button>
          <Link
            href="/admin/categories"
            className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <TagIcon className="h-4 w-4" /> Управление категориями
          </Link>
        </div>
        <Link
          href="/admin/products/new"
          className="hover:bg-opacity-80 rounded-md bg-[#272727] px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          + Создать товар
        </Link>
      </div>

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
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Категории
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Остатки
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Цена
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Редактировать</span>
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
