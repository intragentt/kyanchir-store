// Местоположение: /src/components/admin/ConflictResolutionModal.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ExclamationTriangleIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import type {
  SkuResolutionPlan,
  SkuConflict,
} from '@/app/api/admin/utils/backfill-skus/route';

// Тип для хранения решений пользователя
export type UserResolutions = {
  [moySkladId: string]: 'FIX_SKU' | 'REVERT_CATEGORY';
};

// --- Компонент для одного конфликта ---
interface ConflictItemProps {
  conflict: SkuConflict;
  resolution: 'FIX_SKU' | 'REVERT_CATEGORY' | undefined;
  onResolve: (id: string, action: 'FIX_SKU' | 'REVERT_CATEGORY') => void;
}

function ConflictItem({ conflict, resolution, onResolve }: ConflictItemProps) {
  const canRevert = !!conflict.expectedCategoryFromArticle;

  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-sm font-semibold text-gray-800">{conflict.name}</p>
      <div className="mt-1 text-xs text-gray-500">
        <p>
          <span className="font-medium">Текущий артикул:</span>{' '}
          <code>{conflict.currentArticle}</code>
        </p>
        <p>
          <span className="font-medium">Текущая категория:</span>{' '}
          {conflict.currentCategory.name}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Опция 1: Исправить артикул */}
        <button
          onClick={() => onResolve(conflict.moySkladId, 'FIX_SKU')}
          className={`flex flex-col items-start rounded-md p-2 text-left ring-2 transition-all ${
            resolution === 'FIX_SKU'
              ? 'bg-indigo-50 ring-indigo-500'
              : 'ring-gray-200 hover:ring-indigo-400'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-700">
            <WrenchScrewdriverIcon className="h-4 w-4" />
            Исправить Артикул
          </div>
          <p className="mt-1 text-xs text-indigo-600">
            Артикул будет изменен, чтобы соответствовать категории &quot;
            {conflict.currentCategory.name}&quot;.
          </p>
          <code className="mt-1 text-xs text-gray-500">
            {conflict.currentArticle} &rarr; {conflict.expectedArticle}
          </code>
        </button>

        {/* Опция 2: Вернуть товар */}
        <button
          onClick={() =>
            canRevert && onResolve(conflict.moySkladId, 'REVERT_CATEGORY')
          }
          disabled={!canRevert}
          className={`flex flex-col items-start rounded-md p-2 text-left ring-2 transition-all ${
            resolution === 'REVERT_CATEGORY'
              ? 'bg-green-50 ring-green-500'
              : 'ring-gray-200 hover:ring-green-400'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold text-green-700">
            <ArrowUturnLeftIcon className="h-4 w-4" />
            Вернуть Товар
          </div>
          <p className="mt-1 text-xs text-green-600">
            {canRevert
              ? `Товар будет перемещен обратно в категорию &quot;${conflict.expectedCategoryFromArticle?.name}&quot;.`
              : 'Невозможно определить категорию по артикулу.'}
          </p>
        </button>
      </div>
    </div>
  );
}

// --- Основное модальное окно ---
interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resolutions: UserResolutions) => void;
  plan: SkuResolutionPlan | null;
  isExecuting: boolean;
}

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  plan,
  onConfirm,
  isExecuting,
}: ConflictResolutionModalProps) {
  const [resolutions, setResolutions] = useState<UserResolutions>({});

  useEffect(() => {
    // Сбрасываем решения при открытии нового плана
    if (plan) {
      setResolutions({});
    }
  }, [plan]);

  const handleResolve = (id: string, action: 'FIX_SKU' | 'REVERT_CATEGORY') => {
    setResolutions((prev) => ({ ...prev, [id]: action }));
  };

  const unresolvedConflicts =
    plan?.conflicts.filter((c) => !resolutions[c.moySkladId]).length || 0;

  if (!plan) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900"
                  >
                    Ревизия Артикулов
                  </Dialog.Title>
                  <div className="mt-2 max-h-[70vh] space-y-4 overflow-y-auto pr-2">
                    {plan.conflicts.length > 0 && (
                      <section>
                        <h4 className="text-md flex items-center gap-2 font-medium text-orange-700">
                          <ExclamationTriangleIcon className="h-5 w-5" />
                          Конфликты ({plan.conflicts.length})
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          Артикул товара не соответствует его категории.
                          Выберите действие для каждого конфликта.
                        </p>
                        <div className="mt-2 space-y-2">
                          {plan.conflicts.map((conflict) => (
                            <ConflictItem
                              key={conflict.moySkladId}
                              conflict={conflict}
                              resolution={resolutions[conflict.moySkladId]}
                              onResolve={handleResolve}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                    {plan.toCreate.length > 0 && (
                      <section>
                        <h4 className="text-md flex items-center gap-2 font-medium text-green-700">
                          <PlusCircleIcon className="h-5 w-5" />
                          Будут созданы артикулы ({plan.toCreate.length})
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          Эти товары не имеют артикула. Он будет создан
                          автоматически.
                        </p>
                      </section>
                    )}
                    {plan.okCount > 0 && (
                      <section>
                        <h4 className="text-md flex items-center gap-2 font-medium text-gray-500">
                          <CheckCircleIcon className="h-5 w-5" />В порядке (
                          {plan.okCount})
                        </h4>
                      </section>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    disabled={isExecuting || unresolvedConflicts > 0}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                    onClick={() => onConfirm(resolutions)}
                  >
                    {isExecuting ? 'Выполнение...' : `Применить решения`}
                  </button>
                  <button
                    type="button"
                    disabled={isExecuting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Отмена
                  </button>
                  {unresolvedConflicts > 0 && (
                    <p className="mt-2 text-xs text-orange-600 sm:mr-4 sm:mt-0 sm:self-center">
                      Осталось нерешенных конфликтов: {unresolvedConflicts}
                    </p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
