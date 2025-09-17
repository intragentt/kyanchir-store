// Местоположение: src/components/admin/ProductTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import type { ProductForTable } from '@/app/admin/dashboard/page';
import type { Prisma, Category, Tag } from '@prisma/client';
import { ProductTableRow } from './product-table/ProductTableRow';

type FilterPresetWithItems = Prisma.FilterPresetGetPayload<{
  include: { items: { include: { category: true; tag: true } } };
}>;

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

// --- НАЧАЛО НОВОГО КОДА: Иконка для кнопки сброса ---
const ResetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
      clipRule="evenodd"
    />
  </svg>
);
// --- КОНЕЦ НОВОГО КОДА ---

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
  const [isResetting, setIsResetting] = useState(false); // <-- Новое состояние

  const handleSync = async () => {
    setIsSyncing(true);
    toast.loading('Синхронизация со складом...', { id: 'sync' });

    await fetch('/api/admin/sync/categories', { method: 'POST' });
    await fetch('/api/admin/sync/products', { method: 'POST' });

    toast.success('Синхронизация завершена!', { id: 'sync' });
    router.refresh();
    setIsSyncing(false);
  };

  // --- НАЧАЛО НОВОГО КОДА: Функция для сброса ---
  const handleReset = async () => {
    const confirmation = window.confirm(
      'ВЫ УВЕРЕНЫ?\nЭто действие полностью удалит ВСЕ товары, варианты и размеры с сайта Kyanchir.\nДанные в "МойСклад" затронуты НЕ будут.\n\nЭто действие необратимо.',
    );

    if (!confirmation) {
      return;
    }

    setIsResetting(true);
    const toastId = toast.loading('Очистка склада Kyanchir...');

    try {
      const response = await fetch('/api/admin/sync/reset-products', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сбросе');
      }

      toast.success(
        `Склад очищен! Удалено ${data.deletedProductsCount} товаров.`,
        { id: toastId },
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Неизвестная ошибка',
        { id: toastId },
      );
    } finally {
      setIsResetting(false);
    }
  };
  // --- КОНЕЦ НОВОГО КОДА ---

  return (
    <div className="w-full">
      <Toaster position="top-center" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* ... (кнопки Синхронизировать, CSV, Категории без изменений) ... */}
          <button
            onClick={handleSync}
            disabled={isSyncing || isResetting}
            className="flex items-center gap-x-2 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SyncIcon
              className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
            />
            {isSyncing ? 'Синхронизация...' : 'Синхронизировать склад'}
          </button>

          {/* --- НАЧАЛО НОВОГО КОДА: Новая "опасная" кнопка --- */}
          <button
            onClick={handleReset}
            disabled={isResetting || isSyncing}
            className="flex items-center gap-x-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ResetIcon
              className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`}
            />
            {isResetting ? 'Очистка...' : 'Сбросить склад Kyanchir'}
          </button>
          {/* --- КОНЕЦ НОВОГО КОДА --- */}
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-opacity-90"
        >
          + Создать товар
        </Link>
      </div>

      <div className="overflow-x-auto">
        {/* ... (остальной код таблицы без изменений) ... */}
      </div>
    </div>
  );
}
