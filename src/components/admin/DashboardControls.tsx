// Местоположение: /src/components/admin/DashboardControls.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
// --- НАЧАЛО НОВЫХ ИМПОРТОВ ---
import ConflictResolutionModal, {
  UserResolutions,
} from './ConflictResolutionModal';
import type { SkuResolutionPlan } from '@/app/api/admin/utils/backfill-skus/route';
// --- КОНЕЦ НОВЫХ ИМПОРТОВ ---

// --- Иконки (без изменений) ---
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
const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z"
      clipRule="evenodd"
    />
  </svg>
);

export default function DashboardControls() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckingSkus, setIsCheckingSkus] = useState(false); // <--- Переименовано для ясности
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [skuResolutionPlan, setSkuResolutionPlan] =
    useState<SkuResolutionPlan | null>(null);

  // --- Старые обработчики (без изменений) ---
  const handleSync = async () => {
    setIsSyncing(true);
    toast.loading('Синхронизация...', { id: 'sync' });
    await fetch('/api/admin/sync/categories', { method: 'POST' });
    await fetch('/api/admin/sync/products', { method: 'POST' });
    toast.success('Синхронизация завершена!', { id: 'sync' });
    router.refresh();
    setIsSyncing(false);
  };
  const handleReset = async () => {
    const conf = window.confirm('ВЫ УВЕРЕНЫ? ...');
    if (!conf) return;
    setIsResetting(true);
    const toastId = toast.loading('Очистка склада...');
    try {
      const response = await fetch('/api/admin/sync/reset-products', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success(
        `Склад очищен! Удалено ${data.deletedProductsCount} товаров.`,
        { id: toastId },
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка', {
        id: toastId,
      });
    } finally {
      setIsResetting(false);
    }
  };

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Переписанный обработчик ---
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
        toast.dismiss(toastId); // Скрываем "загрузочный" тост, т.к. открываем модалку
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
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const testApiKey = async (keyToTest: string) => {
    const res = await fetch('/api/admin/settings/test-moysklad-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: keyToTest }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };
  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Сначала введите ключ.');
      return;
    }
    setIsTestingKey(true);
    try {
      const result = await testApiKey(apiKey);
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setIsTestingKey(false);
    }
  };
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Ключ не может быть пустым.');
      return;
    }
    setIsSavingKey(true);
    const toastId = toast.loading('Тестирование ключа...');
    try {
      await testApiKey(apiKey);
      toast.loading('Ключ верный. Сохранение...', { id: toastId });
      const saveRes = await fetch('/api/admin/settings/moysklad-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error);
      toast.success(saveData.message, { id: toastId });
      setShowKeyManager(false);
      setApiKey('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка', {
        id: toastId,
      });
    } finally {
      setIsSavingKey(false);
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
              {' '}
              <SyncIcon
                className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
              />{' '}
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать склад'}{' '}
            </button>
            <button
              onClick={handleReset}
              disabled={anyActionInProgress}
              className="flex items-center gap-x-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {' '}
              <ResetIcon
                className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`}
              />{' '}
              {isResetting ? 'Очистка...' : 'Сбросить склад Kyanchir'}{' '}
            </button>
            <button
              onClick={handleCheckSkus}
              disabled={anyActionInProgress}
              className="flex items-center gap-x-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {' '}
              <CheckBadgeIcon
                className={`h-4 w-4 ${isCheckingSkus ? 'animate-spin' : ''}`}
              />{' '}
              {isCheckingSkus ? 'Ревизия...' : 'Проверить артикулы'}{' '}
            </button>
            <Link
              href="/admin/categories"
              className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              {' '}
              <TagIcon className="h-4 w-4" /> Управление категориями{' '}
            </Link>
            <button
              onClick={() => setShowKeyManager(!showKeyManager)}
              className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              {' '}
              <KeyIcon className="h-4 w-4" /> API-ключ МойСклад{' '}
            </button>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-[#6B80C5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-opacity-90"
          >
            {' '}
            + Создать товар{' '}
          </Link>
        </div>
        {showKeyManager && (
          <div className="rounded-lg border bg-gray-50 p-3">
            {' '}
            <label
              htmlFor="api-key"
              className="block text-xs font-medium text-gray-700"
            >
              Новый API-ключ "МойСклад"
            </label>{' '}
            <div className="mt-1 flex items-center gap-2">
              {' '}
              <input
                type="password"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                placeholder="Вставьте сюда новый токен..."
                disabled={isSavingKey || isTestingKey}
              />{' '}
              <button
                onClick={handleTestApiKey}
                disabled={isSavingKey || isTestingKey}
                className="rounded-md border bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {' '}
                {isTestingKey ? '...' : 'Тест'}{' '}
              </button>{' '}
              <button
                onClick={handleSaveApiKey}
                disabled={isSavingKey || isTestingKey}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {' '}
                {isSavingKey ? '...' : 'Сохранить'}{' '}
              </button>{' '}
            </div>{' '}
          </div>
        )}
      </div>
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
