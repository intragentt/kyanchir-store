// Местоположение: /src/components/admin/ApiKeyModal.tsx
'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { KeyIcon } from '@heroicons/react/24/outline';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => Promise<boolean>; // Возвращает true в случае успеха
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      // Можно добавить toast, если нужно, но основная валидация на стороне onSave
      return;
    }
    setIsSaving(true);
    const success = await onSave(apiKey);
    if (success) {
      // Только в случае успеха очищаем и закрываем
      setApiKey('');
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
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
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <KeyIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-gray-900"
                      >
                        Требуется API-ключ МойСклад
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Не удалось подключиться к МойСклад. Вероятно, API-ключ
                          недействителен или не указан. Введите действующий ключ
                          для продолжения.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="api-key-modal" className="sr-only">
                      API-ключ
                    </label>
                    <input
                      type="password"
                      id="api-key-modal"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Вставьте сюда новый токен..."
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    disabled={isSaving || !apiKey.trim()}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                    onClick={handleSave}
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить и продолжить'}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
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
