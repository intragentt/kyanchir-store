// Местоположение: /src/components/admin/DryRunModal.tsx
'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  PlusIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import type { SyncPlan } from '@/app/api/admin/sync/dry-run/route';
import type { CodeRule } from '@prisma/client';

// Определяем новый тип для интерактивного предупреждения
interface InteractiveWarningProps {
  item: SyncPlan['warnings'][0];
  codeRules: CodeRule[];
  onAddRule: (name: string, code: string) => Promise<{ success: boolean }>;
  onAddSynonym: (ruleId: string, name: string) => Promise<{ success: boolean }>;
}

function InteractiveWarning({
  item,
  codeRules,
  onAddRule,
  onAddSynonym,
}: InteractiveWarningProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [newCode, setNewCode] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    let result = { success: false };
    if (mode === 'new' && newCode.trim()) {
      result = await onAddRule(item.name, newCode);
    } else if (mode === 'existing' && selectedRuleId) {
      result = await onAddSynonym(selectedRuleId, item.name);
    }

    if (result.success) {
      setNewCode('');
      setSelectedRuleId('');
    }
    setIsSaving(false);
  };

  const isSaveDisabled =
    isSaving ||
    (mode === 'new' && !newCode.trim()) ||
    (mode === 'existing' && !selectedRuleId);

  return (
    <li className="list-disc">
      <strong>{item.name}:</strong> {item.reason}
      <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('new')}
            className={`flex items-center gap-1.5 text-xs font-medium ${
              mode === 'new'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <PlusIcon className="h-4 w-4" /> Создать новый код
          </button>
          <button
            onClick={() => setMode('existing')}
            className={`flex items-center gap-1.5 text-xs font-medium ${
              mode === 'existing'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <LinkIcon className="h-4 w-4" /> Добавить к существующему
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {mode === 'new' ? (
            <input
              type="text"
              placeholder="Код (напр., BE)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="block w-full rounded-md border-gray-300 py-1 text-sm shadow-sm"
              disabled={isSaving}
            />
          ) : (
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-1 text-sm shadow-sm"
              disabled={isSaving}
            >
              <option value="">-- Выберите код --</option>
              {codeRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.assignedCode}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="flex flex-shrink-0 items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200 disabled:opacity-50"
          >
            <BookOpenIcon className="h-4 w-4" />
            {isSaving ? '...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </li>
  );
}

interface DryRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (plan: SyncPlan) => void;
  onAddRule: (name: string, code: string) => Promise<{ success: boolean }>;
  onAddSynonym: (ruleId: string, name: string) => Promise<{ success: boolean }>;
  plan: SyncPlan | null;
  isExecuting: boolean;
  codeRules: CodeRule[];
}

export default function DryRunModal({
  isOpen,
  onClose,
  plan,
  onConfirm,
  onAddRule,
  onAddSynonym,
  isExecuting,
  codeRules,
}: DryRunModalProps) {
  if (!plan) return null;
  const totalChanges = plan.toCreate.length + plan.toUpdate.length;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Dialog.Panel className="relative w-full max-w-3xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ArrowPathIcon
                        className="h-6 w-6 text-blue-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-gray-900"
                      >
                        План Синхронизации Категорий
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Система проанализировала данные из "МойСклад" и
                          сформировала план. Изменения не будут применены до
                          вашего подтверждения.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                    {plan.toCreate.length > 0 && (
                      <section>
                        <h4 className="text-md flex items-center gap-2 font-medium text-green-700">
                          <PlusCircleIcon className="h-5 w-5" />
                          Будет создано ({plan.toCreate.length})
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                          {plan.toCreate.map((item) => (
                            <li key={item.moyskladId}>
                              {item.name}
                              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs">
                                Код: {item.assignedCode || 'TEMP'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {plan.toUpdate.length > 0 && (
                      <section>
                        <h4 className="text-md flex items-center gap-2 font-medium text-yellow-700">
                          <ArrowPathIcon className="h-5 w-5" />
                          Будет обновлено ({plan.toUpdate.length})
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                          {plan.toUpdate.map((item) => (
                            <li key={item.moyskladId}>
                              <span className="text-red-600 line-through">
                                {item.oldName}
                              </span>{' '}
                              →{' '}
                              <span className="font-semibold text-green-700">
                                {item.newName}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {plan.noAction.length > 0 && (
                      <section>
                        <h4 className="text-md flex items-center gap-2 font-medium text-gray-500">
                          <CheckCircleIcon className="h-5 w-5" />
                          Без изменений ({plan.noAction.length})
                        </h4>
                        <p className="mt-1 text-xs text-gray-400">
                          Эти категории уже синхронизированы.
                        </p>
                      </section>
                    )}
                    {plan.warnings.length > 0 && (
                      <section>
                        <h4 className="text-md flex items-center gap-2 font-medium text-orange-700">
                          <ExclamationTriangleIcon className="h-5 w-5" />
                          Предупреждения ({plan.warnings.length})
                        </h4>
                        <ul className="mt-2 space-y-3 pl-5 text-sm text-gray-600">
                          {plan.warnings.map((item, index) =>
                            item.reason.includes('Словаре') ? (
                              <InteractiveWarning
                                key={`${item.moyskladId}-${index}`}
                                item={item}
                                codeRules={codeRules}
                                onAddRule={onAddRule}
                                onAddSynonym={onAddSynonym}
                              />
                            ) : (
                              <li
                                key={`${item.moyskladId}-${index}`}
                                className="list-disc"
                              >
                                <strong>{item.name}:</strong> {item.reason}
                              </li>
                            ),
                          )}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    disabled={isExecuting || totalChanges === 0}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                    onClick={() => onConfirm(plan)}
                  >
                    {isExecuting
                      ? 'Выполнение...'
                      : `Применить изменения (${totalChanges})`}
                  </button>
                  <button
                    type="button"
                    disabled={isExecuting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Отмена
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
