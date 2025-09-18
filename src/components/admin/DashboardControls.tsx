// Местоположение: /src/components/admin/DashboardControls.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SlidersHorizontal } from 'lucide-react';
import ConflictResolutionModal, {
  UserResolutions,
} from './ConflictResolutionModal';
import ApiKeyModal from './ApiKeyModal';
import type { SkuResolutionPlan } from '@/app/api/admin/utils/backfill-skus/route';
import { cn } from '@/lib/utils';

const SyncIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
      clipRule="evenodd"
    />
  </svg>
);
const ResetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
      clipRule="evenodd"
    />
  </svg>
);
const CheckBadgeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
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

interface DashboardControlsProps {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
}

export default function DashboardControls({
  isEditMode,
  setIsEditMode,
}: DashboardControlsProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckingSkus, setIsCheckingSkus] = useState(false);
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [skuResolutionPlan, setSkuResolutionPlan] =
    useState<SkuResolutionPlan | null>(null);

  const handleSaveApiKey = async (apiKey: string): Promise<boolean> => {
    const toastId = toast.loading('Тестирование и сохранение ключа...');
    try {
      const testResponse = await fetch(
        '/api/admin/settings/test-moysklad-key',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
        },
      );
      if (!testResponse.ok) {
        const data = await testResponse.json();
        throw new Error(data.error || 'Ключ не прошел проверку');
      }
      const saveResponse = await fetch('/api/admin/settings/moysklad-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok)
        throw new Error(saveData.error || 'Ошибка сохранения');
      toast.success(saveData.message, { id: toastId });
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось сохранить ключ.',
        { id: toastId },
      );
      return false;
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Синхронизация со складом...');
    try {
      const catResponse = await fetch('/api/admin/sync/categories', {
        method: 'POST',
      });
      if (catResponse.status === 401) throw new Error('AUTH_ERROR');
      if (!catResponse.ok) {
        const data = await catResponse.json();
        throw new Error(data.error || 'Ошибка синхронизации категорий');
      }

      const prodResponse = await fetch('/api/admin/sync/products', {
        method: 'POST',
      });
      if (prodResponse.status === 401) throw new Error('AUTH_ERROR');
      if (!prodResponse.ok) {
        const data = await prodResponse.json();
        throw new Error(data.error || 'Ошибка синхронизации товаров');
      }

      toast.success('Синхронизация завершена!', { id: toastId });
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_ERROR') {
        toast.error('Ошибка авторизации. Требуется API-ключ.', { id: toastId });
        setIsApiKeyModalOpen(true);
      } else {
        toast.error(
          error instanceof Error ? error.message : 'Неизвестная ошибка',
          { id: toastId },
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = async () => {
    const conf = window.confirm(
      'ВЫ УВЕРЕНЫ?\nЭто действие полностью удалит ВСЕ товары, варианты и размеры с сайта Kyanchir.\nДанные в "МойСклад" затронуты НЕ будут.\n\nЭто действие необратимо.',
    );
    if (!conf) return;
    setIsResetting(true);
    const toastId = toast.loading('Очистка склада Kyanchir...');
    try {
      const response = await fetch('/api/admin/sync/reset-products', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при сбросе');
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

  const handleCheckSkus = async () => {
    setIsCheckingSkus(true);
    const toastId = toast.loading('Ревизия артикулов в МойСклад...');
    try {
      const response = await fetch('/api/admin/utils/backfill-skus', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при ревизии');
      const plan = data.plan as SkuResolutionPlan;
      if (plan.conflicts.length === 0 && plan.toCreate.length === 0) {
        toast.success('Все артикулы в полном порядке!', { id: toastId });
      } else {
        setSkuResolutionPlan(plan);
        setIsConflictModalOpen(true);
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Неизвестная ошибка',
        { id: toastId },
      );
    } finally {
      setIsCheckingSkus(false);
    }
  };

  const handleConfirmResolution = async (resolutions: UserResolutions) => {
    setIsExecutingPlan(true);
    const toastId = toast.loading('Применение решений...');
    try {
      const response = await fetch('/api/admin/utils/execute-sku-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: skuResolutionPlan, resolutions }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Ошибка при выполнении плана');
      toast.success(
        `План выполнен! Исправлено: ${data.articlesFixed}, Перемещено: ${data.categoriesReverted}, Создано: ${data.articlesCreated}.`,
        { id: toastId, duration: 6000 },
      );
      setIsConflictModalOpen(false);
      setSkuResolutionPlan(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Неизвестная ошибка',
        { id: toastId },
      );
    } finally {
      setIsExecutingPlan(false);
    }
  };

  const anyActionInProgress =
    isSyncing || isResetting || isCheckingSkus || isExecutingPlan;

  return (
    <>
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSync}
              disabled={anyActionInProgress}
              className="flex items-center gap-x-2 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SyncIcon
                className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать склад'}
            </button>
            <button
              onClick={handleReset}
              disabled={anyActionInProgress}
              className="flex items-center gap-x-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ResetIcon
                className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`}
              />
              {isResetting ? 'Очистка...' : 'Сбросить склад Kyanchir'}
            </button>
            <button
              onClick={handleCheckSkus}
              disabled={anyActionInProgress}
              className="flex items-center gap-x-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckBadgeIcon
                className={`h-4 w-4 ${isCheckingSkus ? 'animate-spin' : ''}`}
              />
              {isCheckingSkus ? 'Ревизия...' : 'Проверить артикулы'}
            </button>
            <Link
              href="/admin/categories"
              className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <TagIcon className="h-4 w-4" /> Управление категориями
            </Link>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              disabled={anyActionInProgress}
              className={cn(
                'flex items-center gap-x-2 rounded-md border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50',
                isEditMode
                  ? 'border-green-300 bg-green-100 text-green-800 hover:bg-green-200'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isEditMode ? 'Завершить' : 'Редактировать'}
            </button>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-opacity-90"
          >
            + Создать товар
          </Link>
        </div>
      </div>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={async (newKey) => {
          const success = await handleSaveApiKey(newKey);
          if (success) {
            handleSync();
          }
          return success;
        }}
      />

      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={handleConfirmResolution}
        plan={skuResolutionPlan}
        isExecuting={isExecutingPlan}
      />
    </>
  );
}
