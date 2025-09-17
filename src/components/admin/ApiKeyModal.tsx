// Местоположение: /src/components/admin/ApiKeyModal.tsx
'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { KeyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
  const [isTesting, setIsTesting] = useState(false);

  const testApiKey = async (key: string) => {
    /* ... логика теста ... */
  };
  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(apiKey);
    if (success) {
      onClose();
      setApiKey('');
    }
    setIsSaving(false);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        {/* ... остальная JSX разметка модального окна ... */}
        <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <KeyIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
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
                    недействителен или не указан. Введите действующий ключ для
                    продолжения.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="block w-full rounded-md border-gray-300 text-sm shadow-sm"
                placeholder="Вставьте сюда новый токен..."
              />
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={isSaving}
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
      </Dialog>
    </Transition.Root>
  );
}
